document.addEventListener('DOMContentLoaded', () => {
    // --- Language Toggle Logic ---
    let currentLang = localStorage.getItem('lang') || 'ko';
    const langToggle = document.getElementById('lang-toggle');
    
    function updateLanguage() {
        const koElems = document.querySelectorAll('.lang-ko');
        const enElems = document.querySelectorAll('.lang-en');
        
        if (currentLang === 'ko') {
            koElems.forEach(el => el.classList.remove('hidden'));
            enElems.forEach(el => el.classList.add('hidden'));
            langToggle.textContent = '🌐 EN';
            // Update placeholders
            document.getElementById('name').placeholder = "성함 또는 업체명";
            document.getElementById('message').placeholder = "문의 내용";
        } else {
            koElems.forEach(el => el.classList.add('hidden'));
            enElems.forEach(el => el.classList.remove('hidden'));
            langToggle.textContent = '🌐 KO';
            // Update placeholders
            document.getElementById('name').placeholder = "Name or Company";
            document.getElementById('message').placeholder = "Your message";
        }
        localStorage.setItem('lang', currentLang);
    }

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            currentLang = currentLang === 'ko' ? 'en' : 'ko';
            updateLanguage();
        });
    }
    updateLanguage();

    // --- Tab Switching Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const pages = document.querySelectorAll('.page-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            tabBtns.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
            if (target !== 'animal-page' && webcam) {
                webcam.stop();
                document.getElementById('webcam-container').innerHTML = '';
                document.getElementById('start-webcam-btn').classList.remove('hidden');
            }
        });
    });

    // --- Existing Menu Recommender Logic ---
    const generateBtn = document.getElementById('generate-btn');
    const selectedMenuElem = document.getElementById('selected-menu');
    const categoryBadgeElem = document.getElementById('category-badge');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const menuData = [
        { category: { ko: '한식', en: 'Korean' }, menus: { ko: ['김치찌개', '된장찌개', '제육볶음', '비빔밥', '불고기', '삼겹살', '순두부찌개', '보쌈', '닭갈비', '냉면'], en: ['Kimchi Stew', 'Soybean Stew', 'Jeyuk Bokkeum', 'Bibimbap', 'Bulgogi', 'Samgyeopsal', 'Soft Tofu Stew', 'Bossam', 'Dakgalbi', 'Naengmyeon'] } },
        { category: { ko: '일식', en: 'Japanese' }, menus: { ko: ['초밥', '돈카츠', '라멘', '우동', '규동', '사케동', '텐동', '메밀소바', '야키소바', '오코노미야키'], en: ['Sushi', 'Tonkatsu', 'Ramen', 'Udon', 'Gyudon', 'Sakedon', 'Tendon', 'Soba', 'Yakisoba', 'Okonomiyaki'] } },
        { category: { ko: '중식', en: 'Chinese' }, menus: { ko: ['짜장면', '짬뽕', '탕수육', '마라탕', '꿔바로우', '볶음밥', '마파두부', '딤섬', '양꼬치', '잡채밥'], en: ['Jajangmyeon', 'Jjamppong', 'Tangsuyuk', 'Malatang', 'Guobaorou', 'Fried Rice', 'Mapo Tofu', 'Dim Sum', 'Lamb Skewers', 'Japchaebap'] } },
        { category: { ko: '양식/기타', en: 'Western/Other' }, menus: { ko: ['파스타', '피자', '스테이크', '햄버거', '샌드위치', '샐러드', '타코', '커리', '쌀국수', '팟타이'], en: ['Pasta', 'Pizza', 'Steak', 'Burger', 'Sandwich', 'Salad', 'Taco', 'Curry', 'Pho', 'Pad Thai'] } }
    ];

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            let theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('theme', theme);
        });
    }

    function getRandomMenu() {
        const randomCategoryObj = menuData[Math.floor(Math.random() * menuData.length)];
        const category = randomCategoryObj.category[currentLang];
        const menuList = randomCategoryObj.menus[currentLang];
        const randomMenu = menuList[Math.floor(Math.random() * menuList.length)];
        return { category, name: randomMenu };
    }

    function displayMenu() {
        const menu = getRandomMenu();
        categoryBadgeElem.innerHTML = `<span class="lang-ko">${menu.category}</span>`;
        selectedMenuElem.innerHTML = `<span class="lang-ko">${menu.name}</span>`;
        selectedMenuElem.classList.remove('animate-pop');
        void selectedMenuElem.offsetWidth; 
        selectedMenuElem.classList.add('animate-pop');
    }

    if (generateBtn) generateBtn.addEventListener('click', displayMenu);

    // --- Animal Face Test Logic ---
    const TM_URL = "https://teachablemachine.withgoogle.com/models/QQdwPg8Iz/";
    let model, webcam, labelContainer, maxPredictions;
    let isWebcamMode = false;

    const startWebcamBtn = document.getElementById('start-webcam-btn');
    const fileUpload = document.getElementById('file-upload');
    const imagePreview = document.getElementById('image-preview');
    const webcamContainer = document.getElementById('webcam-container');
    const analysisViewer = document.getElementById('analysis-viewer');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resetBtn = document.getElementById('reset-test-btn');

    async function loadModel() {
        if (!model) {
            const modelURL = TM_URL + "model.json";
            const metadataURL = TM_URL + "metadata.json";
            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();
        }
    }

    function createLabels() {
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = '';
        for (let i = 0; i < maxPredictions; i++) {
            const wrapper = document.createElement("div");
            wrapper.className = "result-bar-wrapper";
            wrapper.innerHTML = `
                <div class="label-text">
                    <span class="class-name"></span>
                    <span class="class-prob">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            `;
            labelContainer.appendChild(wrapper);
        }
    }

    async function initWebcam() {
        isWebcamMode = true;
        analysisViewer.classList.remove('hidden');
        webcamContainer.classList.remove('hidden');
        imagePreview.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        await loadModel();
        createLabels();
        webcam = new tmImage.Webcam(200, 200, true);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loopTM);
        webcamContainer.appendChild(webcam.canvas);
        loadingSpinner.classList.add('hidden');
        startWebcamBtn.classList.add('hidden');
        resetBtn.classList.remove('hidden');
    }

    async function handleFileUpload(e) {
        isWebcamMode = false;
        const file = e.target.files[0];
        if (!file) return;
        analysisViewer.classList.remove('hidden');
        imagePreview.classList.remove('hidden');
        webcamContainer.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        if (webcam) webcam.stop();
        const reader = new FileReader();
        reader.onload = async (event) => {
            imagePreview.src = event.target.result;
            await loadModel();
            createLabels();
            imagePreview.onload = async () => {
                await predictTM(imagePreview);
                loadingSpinner.classList.add('hidden');
            };
        };
        reader.readAsDataURL(file);
        resetBtn.classList.remove('hidden');
    }

    async function loopTM() {
        if (isWebcamMode && webcam && webcam.canvas) {
            webcam.update();
            await predictTM(webcam.canvas);
            window.requestAnimationFrame(loopTM);
        }
    }

    async function predictTM(element) {
        const prediction = await model.predict(element);
        for (let i = 0; i < maxPredictions; i++) {
            const className = prediction[i].className;
            const probability = (prediction[i].probability * 100).toFixed(0);
            const wrapper = labelContainer.childNodes[i];
            wrapper.querySelector('.class-name').textContent = className === 'dog' ? (currentLang === 'ko' ? '강아지' : 'Dog') : (currentLang === 'ko' ? '고양이' : 'Cat');
            wrapper.querySelector('.class-prob').textContent = probability + "%";
            wrapper.querySelector('.progress-fill').style.width = probability + "%";
        }
    }

    if (startWebcamBtn) startWebcamBtn.addEventListener('click', initWebcam);
    if (fileUpload) fileUpload.addEventListener('change', handleFileUpload);
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (webcam) webcam.stop();
            isWebcamMode = false;
            webcamContainer.innerHTML = '';
            imagePreview.src = '';
            labelContainer.innerHTML = '';
            analysisViewer.classList.add('hidden');
            resetBtn.classList.add('hidden');
            startWebcamBtn.classList.remove('hidden');
            fileUpload.value = '';
        });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = currentLang === 'ko' ? '보내는 중...' : 'Sending...';
            submitBtn.disabled = true;
            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    alert(currentLang === 'ko' ? '문의가 성공적으로 전송되었습니다!' : 'Inquiry sent successfully!');
                    contactForm.reset();
                } else {
                    alert(currentLang === 'ko' ? '전송 중 오류가 발생했습니다.' : 'Error during sending.');
                }
            } catch (error) {
                alert(currentLang === 'ko' ? '네트워크 오류가 발생했습니다.' : 'Network error.');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
