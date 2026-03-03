document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const selectedMenuElem = document.getElementById('selected-menu');
    const categoryBadgeElem = document.getElementById('category-badge');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Dinner Menu Data
    const menuData = [
        { category: '한식', menus: ['김치찌개', '된장찌개', '제육볶음', '비빔밥', '불고기', '삼겹살', '순두부찌개', '보쌈', '닭갈비', '냉면'] },
        { category: '일식', menus: ['초밥', '돈카츠', '라멘', '우동', '규동', '사케동', '텐동', '메밀소바', '야키소바', '오코노미야키'] },
        { category: '중식', menus: ['짜장면', '짬뽕', '탕수육', '마라탕', '꿔바로우', '볶음밥', '마파두부', '딤섬', '양꼬치', '잡채밥'] },
        { category: '양식/기타', menus: ['파스타', '피자', '스테이크', '햄버거', '샌드위치', '샐러드', '타코', '커리', '쌀국수', '팟타이'] }
    ];

    // Theme logic
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        let theme = 'light';
        if (body.classList.contains('dark-mode')) {
            theme = 'dark';
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
        localStorage.setItem('theme', theme);
    });

    function getRandomMenu() {
        const randomCategoryObj = menuData[Math.floor(Math.random() * menuData.length)];
        const randomMenu = randomCategoryObj.menus[Math.floor(Math.random() * randomCategoryObj.menus.length)];
        return {
            category: randomCategoryObj.category,
            name: randomMenu
        };
    }

    function displayMenu() {
        // Animation reset
        selectedMenuElem.classList.remove('animate-pop');
        void selectedMenuElem.offsetWidth; // trigger reflow
        
        const menu = getRandomMenu();
        
        categoryBadgeElem.textContent = menu.category;
        selectedMenuElem.textContent = menu.name;
        
        // Add animation
        selectedMenuElem.classList.add('animate-pop');
    }

    generateBtn.addEventListener('click', () => {
        displayMenu();
    });

    // Form submission handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            const originalBtnText = submitBtn.textContent;
            
            submitBtn.textContent = '보내는 중...';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            
            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    alert('문의가 성공적으로 전송되었습니다!');
                    contactForm.reset();
                } else {
                    const data = await response.json();
                    if (Object.hasOwn(data, 'errors')) {
                        alert(data["errors"].map(error => error["message"]).join(", "));
                    } else {
                        alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    }
                }
            } catch (error) {
                alert('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
