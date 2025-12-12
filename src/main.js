document.addEventListener("DOMContentLoaded", () => {
    // 1. Инициализация библиотек
    lucide.createIcons();

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

    // GSAP ScrollTrigger Config
    gsap.registerPlugin(ScrollTrigger);

    // 2. Хедер и Навигация
    const burger = document.querySelector('.header__burger');
    const nav = document.querySelector('.header__nav');
    const header = document.querySelector('.header');

    burger.addEventListener('click', () => {
        nav.classList.toggle('active');
        burger.classList.toggle('active');
        
        if (nav.classList.contains('active')) {
            gsap.to('.header__burger span:nth-child(1)', { rotate: 45, y: 8, duration: 0.3 });
            gsap.to('.header__burger span:nth-child(2)', { opacity: 0, duration: 0.3 });
             // Adding logic for 3rd span if you decide to add it back in CSS for standard burger
        } else {
            gsap.to('.header__burger span', { rotate: 0, y: 0, opacity: 1, duration: 0.3 });
        }
    });

    document.querySelectorAll('.header__link, .js-scroll-to').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            nav.classList.remove('active');
            burger.classList.remove('active');
            gsap.to('.header__burger span', { rotate: 0, y: 0, opacity: 1, duration: 0.3 });

            const targetId = link.getAttribute('href');
            lenis.scrollTo(targetId, { offset: -80 });
        });
    });

    // Хедер при скролле
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 11, 0.95)';
        } else {
            header.style.background = 'rgba(10, 10, 11, 0.8)';
        }
    });


    // 3. THREE.JS Hero Animation (Абстрактная нейросеть)
    const initThreeHero = () => {
        const canvasContainer = document.getElementById('hero-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
        canvasContainer.appendChild(renderer.domElement);

        // Частицы
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 150;
        const posArray = new Float32Array(particlesCount * 3);
        
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 10; // Разброс частиц
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.04,
            color: 0x6366F1,
            transparent: true,
            opacity: 0.8,
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Линии между частицами (упрощенная версия для производительности)
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x6366F1, transparent: true, opacity: 0.2 });
        const linesGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(particlesCount * 3 * 2); // Максимум связей
        linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
        scene.add(linesMesh);

        camera.position.z = 5;

        // Анимация
        let mouseX = 0;
        let mouseY = 0;
        window.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
        });

        const animate = () => {
            requestAnimationFrame(animate);
            particlesMesh.rotation.y += 0.001;
            particlesMesh.rotation.x += 0.001;

            // Эффект параллакса от мыши
            camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
            camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

             // Обновление линий (простая логика соединения близких частиц)
            const positions = particlesMesh.geometry.attributes.position.array;
            let vertexIndex = 0;
            const connectionDistance = 1.5;

            for (let i = 0; i < particlesCount; i++) {
                for (let j = i + 1; j < particlesCount; j++) {
                    const dx = positions[i * 3] - positions[j * 3];
                    const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                    const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < connectionDistance) {
                        linePositions[vertexIndex++] = positions[i * 3];
                        linePositions[vertexIndex++] = positions[i * 3 + 1];
                        linePositions[vertexIndex++] = positions[i * 3 + 2];
                        linePositions[vertexIndex++] = positions[j * 3];
                        linePositions[vertexIndex++] = positions[j * 3 + 1];
                        linePositions[vertexIndex++] = positions[j * 3 + 2];
                    }
                }
            }
            linesMesh.geometry.attributes.position.needsUpdate = true;
            linesMesh.geometry.setDrawRange(0, vertexIndex / 3);


            renderer.render(scene, camera);
        };
        animate();

        // Ресайз
        window.addEventListener('resize', () => {
            camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
        });
    };
    initThreeHero();


    // 4. Глобальные GSAP анимации

    // 4.1 Анимация заголовков (SplitType)
    const splitTexts = document.querySelectorAll('.split-text');
    splitTexts.forEach(text => {
        const split = new SplitType(text, { types: 'lines, words' });
        gsap.from(split.words, {
            scrollTrigger: {
                trigger: text,
                start: 'top 85%',
            },
            opacity: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.05,
            ease: 'power3.out'
        });
    });

    // 4.2 Общие анимации появления (Fade In, Fade Up и т.д.)
    const animateElements = (selector, vars) => {
        document.querySelectorAll(selector).forEach(el => {
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
    animateElements('.fade-up', { y: 40 });
    animateElements('.fade-left', { x: -40 });
    animateElements('.fade-right', { x: 40 });

    // 4.3 Анимация счетчиков в Инновациях
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


    // 5. Контактная форма (Валидация + AJAX Stub)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const captchaLabel = document.getElementById('captchaLabel');
        const captchaInput = document.getElementById('captcha');
        let captchaResult;

        // Генерация простой капчи
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
            const phoneRegex = /^\d+$/;

            // Reset errors
            document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));

            // Name
            if (!contactForm.name.value.trim()) {
                document.getElementById('nameError').parentElement.classList.add('error');
                isValid = false;
            }
            // Email
            if (!emailRegex.test(contactForm.email.value)) {
                document.getElementById('emailError').parentElement.classList.add('error');
                isValid = false;
            }
             // Phone
             if (!phoneRegex.test(contactForm.phone.value)) {
                document.getElementById('phoneError').parentElement.classList.add('error');
                isValid = false;
            }
            // Captcha
            if (parseInt(contactForm.captcha.value) !== captchaResult) {
                document.getElementById('captchaError').parentElement.classList.add('error');
                isValid = false;
            }
            // Consent checked by 'required' attribute browser validation mostly, but good to double check
            if(!contactForm.consent.checked) {
                 isValid = false;
            }

            return isValid;
        };

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const successMsg = document.getElementById('formSuccess');
            const errorMsg = document.getElementById('formError');
            const submitBtn = contactForm.querySelector('.form-submit');

            successMsg.style.display = 'none';
            errorMsg.style.display = 'none';

            if (validateForm()) {
                submitBtn.classList.add('loading');
                
                // Имитация AJAX запроса
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    // Успех (в реальности здесь проверка ответа сервера)
                    successMsg.style.display = 'block';
                    contactForm.reset();
                    generateCaptcha();
                    
                    // Автоскрытие сообщения
                    setTimeout(() => {
                        gsap.to(successMsg, { opacity: 0, duration: 0.5, onComplete: () => {
                            successMsg.style.display = 'none';
                            successMsg.style.opacity = 1;
                        }});
                    }, 5000);

                }, 2000);
            }
        });
    }


    // 6. Cookie Popup
    const cookiePopup = document.getElementById('cookiePopup');
    const cookieAcceptBtn = document.getElementById('cookieAccept');

    if (!localStorage.getItem('cookiesAccepted')) {
        setTimeout(() => {
            cookiePopup.classList.add('active');
        }, 2000);
    }

    cookieAcceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        cookiePopup.classList.remove('active');
    });

});