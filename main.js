document.addEventListener('DOMContentLoaded', () => {
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
            
            // Stop webcam if switching away from animal page
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
        { category: '한식', menus: ['김치찌개', '된장찌개', '제육볶음', '비빔밥', '불고기', '삼겹살', '순두부찌개', '보쌈', '닭갈비', '냉면'] },
        { category: '일식', menus: ['초밥', '돈카츠', '라멘', '우동', '규동', '사케동', '텐동', '메밀소바', '야키소바', '오코노미야키'] },
        { category: '중식', menus: ['짜장면', '짬뽕', '탕수육', '마라탕', '꿔바로우', '볶음밥', '마파두부', '딤섬', '양꼬치', '잡채밥'] },
        { category: '양식/기타', menus: ['파스타', '피자', '스테이크', '햄버거', '샌드위치', '샐러드', '타코', '커리', '쌀국수', '팟타이'] }
    ];

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️';
    }

    if (themeToggle) {
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
    }

    function getRandomMenu() {
        const randomCategoryObj = menuData[Math.floor(Math.random() * menuData.length)];
        const randomMenu = randomCategoryObj.menus[Math.floor(Math.random() * randomCategoryObj.menus.length)];
        return { category: randomCategoryObj.category, name: randomMenu };
    }

    function displayMenu() {
        selectedMenuElem.classList.remove('animate-pop');
        void selectedMenuElem.offsetWidth; 
        const menu = getRandomMenu();
        categoryBadgeElem.textContent = menu.category;
        selectedMenuElem.textContent = menu.name;
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

        const flip = true;
        webcam = new tmImage.Webcam(200, 200, flip);
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
            
            // Wait for image to load before predicting
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
            wrapper.querySelector('.class-name').textContent = className;
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

    // --- Contact Form Logic ---
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
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    alert('문의가 성공적으로 전송되었습니다!');
                    contactForm.reset();
                } else {
                    alert('전송 중 오류가 발생했습니다.');
                }
            } catch (error) {
                alert('네트워크 오류가 발생했습니다.');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
