// Регистрируем плагины сразу
gsap.registerPlugin(ScrollTrigger);

window.addEventListener('load', () => {
    
    // 0. Скрываем прелоадер (если есть)
    const preloader = document.getElementById('preloader');
    if (preloader) {
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => preloader.style.display = 'none'
        });
    }

    initApp();
});

function initApp() {
    
    // --- 1. Инициализация иконок ---
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- 2. Плавный скролл (Lenis) ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);


    // --- 3. Анимация Текста (SplitType) ---
    // Находим все элементы с классом
    const splitElements = document.querySelectorAll('.split-text');

    splitElements.forEach((element) => {
        // 1. Разбиваем текст
        const split = new SplitType(element, { 
            types: 'lines, words',
            lineClass: 'line',
            wordClass: 'word'
        });

        // 2. Сразу скрываем слова через GSAP (чтобы не было видно до анимации)
        gsap.set(split.words, { y: 30, opacity: 0 });

        // 3. Запускаем анимацию для каждого блока отдельно
        gsap.to(split.words, {
            scrollTrigger: {
                trigger: element,
                start: 'top 85%', // Начинать, когда верх элемента на 85% высоты экрана
                toggleActions: 'play none none reverse' // Проигрывать при скролле вниз, реверс при скролле вверх
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.05, // Задержка между словами
            ease: 'power3.out'
        });
    });


    // --- 4. Общая анимация появления блоков (Fade Up) ---
    const fadeElements = document.querySelectorAll('.fade-up, .fade-in, .fade-left, .fade-right');
    
    fadeElements.forEach(el => {
        // Определяем направление на основе класса
        let xVal = 0;
        let yVal = 0;
        
        if (el.classList.contains('fade-up')) yVal = 40;
        if (el.classList.contains('fade-left')) xVal = -40;
        if (el.classList.contains('fade-right')) xVal = 40;

        // Начальное состояние
        gsap.set(el, { opacity: 0, y: yVal, x: xVal });

        // Анимация
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 90%',
            },
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.8,
            delay: el.dataset.delay || 0, // Если есть data-delay
            ease: 'power3.out'
        });
    });


    // --- 5. Анимация счетчиков ---
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        
        // Объект для анимации значения
        let obj = { val: 0 };
        
        gsap.to(obj, {
            val: target,
            scrollTrigger: {
                trigger: counter,
                start: 'top 85%',
            },
            duration: 2,
            ease: 'power2.out',
            onUpdate: function() {
                counter.innerText = Math.ceil(obj.val);
            }
        });
    });


    // --- 6. Хедер и меню ---
    const burger = document.querySelector('.header__burger');
    const nav = document.querySelector('.header__nav');
    
    if (burger) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('active');
            burger.classList.toggle('active');
        });
        
        document.querySelectorAll('.header__link').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                burger.classList.remove('active');
                // Скролл через Lenis
                const href = link.getAttribute('href');
                lenis.scrollTo(href);
            });
        });
    }

    // --- 7. Three.js (Фон Hero) ---
    try {
        initThreeJs();
    } catch (e) {
        console.log("Three.js skipped for performance or error");
    }

    // ВАЖНО: Обновляем ScrollTrigger после того, как SplitType изменил DOM
    ScrollTrigger.refresh();
}


// --- Функция Three.js вынесена отдельно ---
function initThreeJs() {
    const canvasContainer = document.getElementById('hero-canvas');
    if (!canvasContainer) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    canvasContainer.appendChild(renderer.domElement);

    // Частицы
    const particlesCount = 80; // Меньше частиц для стабильности
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.05, color: 0x6366F1, transparent: true, opacity: 0.8 });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 5;

    const animate = () => {
        requestAnimationFrame(animate);
        particlesMesh.rotation.y += 0.001;
        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    });
}