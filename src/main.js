// Ждем полной загрузки страницы (картинки, стили)
window.addEventListener('load', () => {
    
    // 0. Убираем Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('hidden');
        // Запускаем анимации только после исчезновения прелоадера
        setTimeout(initApp, 100); 
    } else {
        initApp();
    }
});

function initApp() {
    // 1. Инициализация иконок
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Инициализация Lenis (Плавный скролл)
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        smooth: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP Config
    gsap.registerPlugin(ScrollTrigger);

    // 3. Хедер и Мобильное меню
    const burger = document.querySelector('.header__burger');
    const nav = document.querySelector('.header__nav');
    const header = document.querySelector('.header');

    if (burger && nav) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('active');
            burger.classList.toggle('active');
            
            // Анимация крестика
            if (nav.classList.contains('active')) {
                gsap.to('.header__burger span:nth-child(1)', { rotate: 45, y: 8, duration: 0.3 });
                gsap.to('.header__burger span:nth-child(2)', { opacity: 0, duration: 0.3 });
            } else {
                gsap.to('.header__burger span', { rotate: 0, y: 0, opacity: 1, duration: 0.3 });
            }
        });

        // Закрытие меню при клике на ссылку
        document.querySelectorAll('.header__link, .js-scroll-to').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                nav.classList.remove('active');
                burger.classList.remove('active');
                gsap.to('.header__burger span', { rotate: 0, y: 0, opacity: 1, duration: 0.3 });

                const targetId = link.getAttribute('href');
                if (targetId && targetId !== '#') {
                    lenis.scrollTo(targetId, { offset: -80 });
                }
            });
        });
    }

    // Хедер фон при скролле
    window.addEventListener('scroll', () => {
        if (header) {
            header.style.background = window.scrollY > 50 
                ? 'rgba(10, 10, 11, 0.95)' 
                : 'rgba(10, 10, 11, 0.8)';
        }
    });

    // 4. Оптимизированный Three.js (Hero)
    const initThreeHero = () => {
        const canvasContainer = document.getElementById('hero-canvas');
        if (!canvasContainer) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Оптимизация для Retina
        canvasContainer.appendChild(renderer.domElement);

        // Уменьшено кол-во частиц для производительности
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 100; 
        const posArray = new Float32Array(particlesCount * 3);
        
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 12; 
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x6366F1,
            transparent: true,
            opacity: 0.8,
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Линии
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x6366F1, transparent: true, opacity: 0.15 });
        const linesGeometry = new THREE.BufferGeometry();
        // Заранее выделяем буфер для линий
        const maxLines = particlesCount * particlesCount;
        const linePositions = new Float32Array(maxLines * 3); 
        linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
        scene.add(linesMesh);

        camera.position.z = 5;

        // Мышь
        let mouseX = 0;
        let mouseY = 0;
        
        // Используем throttle для события mousemove чтобы не перегружать
        let isMouseMoveTicking = false;
        window.addEventListener('mousemove', (e) => {
            if (!isMouseMoveTicking) {
                window.requestAnimationFrame(() => {
                    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
                    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
                    isMouseMoveTicking = false;
                });
                isMouseMoveTicking = true;
            }
        });

        const animate = () => {
            requestAnimationFrame(animate);
            
            // Медленное вращение
            particlesMesh.rotation.y += 0.0005;
            particlesMesh.rotation.x += 0.0002;

            // Параллакс
            camera.position.x += (mouseX * 2 - camera.position.x) * 0.03;
            camera.position.y += (-mouseY * 2 - camera.position.y) * 0.03;
            camera.lookAt(scene.position);

            // Обновление линий (только если видимы)
            const positions = particlesMesh.geometry.attributes.position.array;
            let vertexIndex = 0;
            const connectionDistance = 1.8;

            // Оптимизированный цикл
            for (let i = 0; i < particlesCount; i++) {
                // Вращение точек вместе с мешем (упрощенная симуляция)
                const ix = positions[i * 3];
                const iy = positions[i * 3 + 1];
                const iz = positions[i * 3 + 2];

                for (let j = i + 1; j < particlesCount; j++) {
                    const jx = positions[j * 3];
                    const jy = positions[j * 3 + 1];
                    const jz = positions[j * 3 + 2];

                    const dx = ix - jx;
                    const dy = iy - jy;
                    const dz = iz - jz;
                    const distSq = dx*dx + dy*dy + dz*dz;

                    if (distSq < connectionDistance * connectionDistance) {
                        linePositions[vertexIndex++] = ix;
                        linePositions[vertexIndex++] = iy;
                        linePositions[vertexIndex++] = iz;
                        linePositions[vertexIndex++] = jx;
                        linePositions[vertexIndex++] = jy;
                        linePositions[vertexIndex++] = jz;
                    }
                }
            }
            
            linesMesh.geometry.attributes.position.needsUpdate = true;
            linesMesh.geometry.setDrawRange(0, vertexIndex / 3);
            linesMesh.rotation.copy(particlesMesh.rotation); // Синхронизация вращения

            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
        });
    };

    // Запускаем Three.js
    if (typeof THREE !== 'undefined') {
        initThreeHero();
    }

    // 5. Анимация Текста (ВАЖНО: Ждем шрифты)
    document.fonts.ready.then(() => {
        const splitTexts = document.querySelectorAll('.split-text');
        
        splitTexts.forEach(text => {
            // Сначала делаем текст видимым, так как CSS его скрыл
            text.style.opacity = 1;
            
            const split = new SplitType(text, { types: 'lines, words' });
            
            gsap.from(split.words, {
                scrollTrigger: {
                    trigger: text,
                    start: 'top 85%',
                },
                opacity: 0,
                y: 20,
                duration: 0.8,
                stagger: 0.05,
                ease: 'power3.out'
            });
        });
    });

    // 6. Общие анимации (Fade)
    const animateElements = (selector, vars) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                },
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out',
                delay: el.dataset.delay || 0,
                ...vars
            });
        });
    };

    animateElements('.fade-in', {});
    animateElements('.fade-up', { y: 30 });
    animateElements('.fade-left', { x: -30 });
    animateElements('.fade-right', { x: 30 });

    // 7. Счетчики
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        gsap.to(counter, {
            scrollTrigger: {
                trigger: counter,
                start: 'top 85%',
            },
            innerText: target,
            duration: 2,
            snap: { innerText: 1 },
            ease: 'power2.out'
        });
    });

    // 8. Контактная форма
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const captchaLabel = document.getElementById('captchaLabel');
        const captchaInput = document.getElementById('captcha');
        let captchaResult;

        const generateCaptcha = () => {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            captchaResult = num1 + num2;
            captchaLabel.textContent = `Сколько будет ${num1} + ${num2}?`;
            captchaInput.value = '';
        };
        generateCaptcha();

        const validateForm = () => {
            let isValid = true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            // Сброс ошибок
            document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));

            // Валидация
            if (!contactForm.name.value.trim()) {
                document.getElementById('nameError').parentElement.classList.add('error');
                isValid = false;
            }
            if (!emailRegex.test(contactForm.email.value)) {
                document.getElementById('emailError').parentElement.classList.add('error');
                isValid = false;
            }
            // Простая проверка телефона (только цифры)
            if (!/^\d+$/.test(contactForm.phone.value)) {
                document.getElementById('phoneError').parentElement.classList.add('error');
                isValid = false;
            }
            if (parseInt(contactForm.captcha.value) !== captchaResult) {
                document.getElementById('captchaError').parentElement.classList.add('error');
                isValid = false;
            }
            if(!contactForm.consent.checked) isValid = false;

            return isValid;
        };

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const successMsg = document.getElementById('formSuccess');
            const submitBtn = contactForm.querySelector('.form-submit');

            if (validateForm()) {
                submitBtn.classList.add('loading');
                
                // Эмуляция отправки
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    successMsg.style.display = 'block';
                    successMsg.style.opacity = 1;
                    contactForm.reset();
                    generateCaptcha();
                    
                    setTimeout(() => {
                        gsap.to(successMsg, { 
                            opacity: 0, 
                            duration: 0.5, 
                            onComplete: () => { successMsg.style.display = 'none'; } 
                        });
                    }, 4000);
                }, 1500);
            }
        });
    }

    // 9. Cookie Popup
    const cookiePopup = document.getElementById('cookiePopup');
    const cookieAcceptBtn = document.getElementById('cookieAccept');

    if (cookiePopup && !localStorage.getItem('cookiesAccepted')) {
        setTimeout(() => {
            cookiePopup.classList.add('active');
        }, 2500);
    }

    if (cookieAcceptBtn) {
        cookieAcceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            cookiePopup.classList.remove('active');
        });
    }
}