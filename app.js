// ===== Criative.IA - App Logic =====
window.onerror = function(msg, url, line, col, error) {
    alert('ERRO DETECTADO:\n' + msg + '\nLinha: ' + line);
    return false;
};

let supabase;
try {
    supabase = window.supabase.createClient(
        'https://rlsqstfjmezeezlerqdo.supabase.co',
        'sb_publishable_c221_1pfJw9JjGu-4u-6xA_YKPMWs1x'
    );
} catch (err) {
    alert('ERRO ao criar cliente Supabase: ' + err.message);
}
let userEmail = null;

// Estado global
let credits = 3;
let currentPlan = 'free';
let generatedCreatives = [];
let selectedCreative = null;

// Templates de copy por tom de voz
const copyTemplates = {
    urgencia: {
        headlines: [
            "⏳ ÚLTIMAS VAGAS! {benefit} antes que acabe",
            "🚨 Só HOJE: {benefit} com {discount}% OFF",
            "⏰ ACABA EM: {benefit} — não perca!",
            "🔥 Vagas LIMITADAS: {benefit}",
            "⚠️ Última chance de {benefit}"
        ],
        ctas: [
            "QUERO GARANTIR MINHA VAGA →",
            "SIM, QUERO {benefit} AGORA →",
            "NÃO QUERO PERDER ISSO →",
            "GARANTIR MEU ACESSO →",
            "COMEÇAR AGORA →"
        ],
        hooks: [
            "Você sabia que {percent}% das pessoas que não agem agora se arrependem depois?",
            "Essa oportunidade não vai durar. Sério.",
            "Se você tá lendo isso, é porque ainda dá tempo.",
            "Poucas vagas restantes. Depois que acabar, acabou.",
            "Não deixa pra amanhã o que pode mudar sua vida hoje."
        ]
    },
    autoridade: {
        headlines: [
            "O Método Comprovado Para {benefit}",
            "Como +{students} Alunos Conseguiram {benefit}",
            "A Ciência Por Trás de {benefit}",
            "O Passo a Passo Definitivo Para {benefit}",
            "Descubra o Segredo Para {benefit}"
        ],
        ctas: [
            "QUERO ACESSO AO MÉTODO →",
            "COMEÇAR MINHA TRANSFORMAÇÃO →",
            "ACESSAR O MÉTODO COMPLETO →",
            "QUERO MEUS RESULTADOS →",
            "GARANTIR MEU ACESSO →"
        ],
        hooks: [
            "Depois de {years} anos de pesquisa, finalmente criamos o método definitivo.",
            "Mais de {students} alunos já comprovaram que funciona.",
            "Não é achismo. É ciência. E os resultados falam por si.",
            "O mesmo método que transformou a vida de milhares de pessoas.",
            "Baseado em estudos reais e resultados comprovados."
        ]
    },
    emocional: {
        headlines: [
            "Imagine Acordar Todos os Dias {benefit}",
            "Sua Nova Vida Começa Aqui: {benefit}",
            "Chega de Sofrer — {benefit} de Verdade",
            "Você Merece {benefit} — E Eu Vou Te Mostrar Como",
            "A Transformação Que Vai Mudar Sua Vida"
        ],
        ctas: [
            "QUERO MINHA TRANSFORMAÇÃO →",
            "COMEÇAR MINHA NOVA VIDA →",
            "SIM, EU MEREÇO ISSO →",
            "QUERO ME TRANSFORMAR →",
            "VAMOS JUNTOS →"
        ],
        hooks: [
            "Eu sei como é estar travado. Eu já estive aí.",
            "Sua jornada de transformação começa com um único passo.",
            "Você não precisa fazer isso sozinho(a). Estamos juntos nessa.",
            "Imagine como vai ser sua daqui a 30 dias...",
            "O primeiro passo é sempre o mais difícil. Mas você não está sozinho."
        ]
    },
    direto: {
        headlines: [
            "{benefit}. Sem enrolação.",
            "O Jeito Mais Rápido de {benefit}",
            "{benefit} em 30 Dias. Garantido.",
            "Pare de Perder Tempo. {benefit} Agora.",
            "{benefit} — Método Direto ao Ponto"
        ],
        ctas: [
            "QUERO COMEÇAR →",
            "COMPRAR AGORA →",
            "ACESSAR AGORA →",
            "GARANTIR ACESSO →",
            "QUERO RESULTADOS →"
        ],
        hooks: [
            "Sem enrolação. Sem promessas vazias. Só resultado.",
            "Direto ao ponto. Funciona e ponto.",
            "Cansado de métodos que não funcionam? Esse funciona.",
            "Simples. Direto. Eficaz.",
            "Chega de rodeios. Hora de agir."
        ]
    }
};

// Gatilhos mentais
const triggers = [
    { name: 'Escassez', emoji: '⏳', desc: 'Vagas limitadas, tempo acabando' },
    { name: 'Prova Social', emoji: '👥', desc: 'Milhares já usaram com sucesso' },
    { name: 'Curiosidade', emoji: '🤔', desc: 'Descubra o segredo que...' },
    { name: 'Autoridade', emoji: '👑', desc: 'Método comprovado por especialistas' }
];

// Cores dos templates de imagem
const colorSchemes = [
    { bg: '#6C5CE7', accent: '#FD79A8', text: '#FFFFFF', name: 'Roxo Rosa' },
    { bg: '#E84393', accent: '#FDCB6E', text: '#FFFFFF', name: 'Rosa Dourado' },
    { bg: '#0984E3', accent: '#00B894', text: '#FFFFFF', name: 'Azul Verde' },
    { bg: '#2D3436', accent: '#E17055', text: '#FFFFFF', name: 'Dark Laranja' },
    { bg: '#00B894', accent: '#6C5CE7', text: '#FFFFFF', name: 'Verde Roxo' },
    { bg: '#E17055', accent: '#FDCB6E', text: '#FFFFFF', name: 'Laranja Dourado' },
    { bg: '#6C5CE7', accent: '#00B894', text: '#FFFFFF', name: 'Roxo Verde' },
    { bg: '#2D3436', accent: '#6C5CE7', text: '#FFFFFF', name: 'Dark Roxo' }
];

// ===== FUNÇÕES UTILITÁRIAS =====

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function replaceVars(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
}

function truncate(text, maxLen) {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + '...';
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ===== GERAÇÃO DE COPY =====

function generateCopy(product, tone, triggerIndex) {
    const templates = copyTemplates[tone] || copyTemplates.direto;
    const trigger = triggers[triggerIndex % triggers.length];

    const vars = {
        benefit: truncate(product.mainBenefit, 60),
        discount: Math.floor(Math.random() * 20 + 30),
        percent: Math.floor(Math.random() * 20 + 70),
        students: Math.floor(Math.random() * 5000 + 1000),
        years: Math.floor(Math.random() * 10 + 3)
    };

    const headline = replaceVars(getRandomItem(templates.headlines), vars);
    const cta = replaceVars(getRandomItem(templates.ctas), vars);
    const hook = replaceVars(getRandomItem(templates.hooks), vars);

    // Copy principal para Facebook/Instagram Ads
    const fbCopy = `${hook}\n\n${product.productName} — ${truncate(product.productDesc, 120)}\n\n✅ ${product.mainBenefit}\n✅ Feito para: ${product.targetAudience}\n✅ Acesso imediato após a compra\n\n💰 Por apenas R$ ${product.price}\n\n👇 Clique no botão abaixo e comece AGORA`;

    // Copy para TikTok Ads
    const tiktokCopy = `${hook}\n\n${product.productName}\n\n${product.mainBenefit}\n\n🎯 ${product.targetAudience}\n\n💰 R$ ${product.price}\n\n${cta}`;

    // Copy orgânica (legenda de post)
    const organicCopy = `${getRandomItem(templates.hooks, vars)}\n\n${product.productName} está transformando a vida de milhares de pessoas.\n\n${product.mainBenefit}\n\nVocê vai ficar de fora? 👇\n\n🔗 Link na bio`;

    return { headline, cta, hook, fbCopy, tiktokCopy, organicCopy, trigger };
}

// ===== GERAÇÃO DE IMAGEM (CANVAS) =====

function generateImage(product, scheme, format, headline, trigger) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const isSquare = format === 'square';
    canvas.width = isSquare ? 1080 : 1080;
    canvas.height = isSquare ? 1080 : 1920;

    const w = canvas.width;
    const h = canvas.height;

    // Fundo gradiente
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, scheme.bg);
    grad.addColorStop(1, scheme.accent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Overlay pattern (dots)
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < w; x += 40) {
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Área de conteúdo
    const padding = isSquare ? 80 : 60;
    const contentW = w - padding * 2;

    // Badge do gatilho mental
    const badgeY = isSquare ? 100 : 140;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const badgeText = `${trigger.emoji} ${trigger.name.toUpperCase()}`;
    ctx.font = 'bold 28px Inter, sans-serif';
    const badgeW = ctx.measureText(badgeText).width + 40;
    roundRect(ctx, padding, badgeY, badgeW, 50, 25);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(badgeText, padding + 20, badgeY + 34);

    // Emoji grande decorativo
    const emojiY = isSquare ? 250 : 320;
    ctx.font = `${isSquare ? 120 : 140}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🎯', w / 2, emojiY);

    // Linha decorativa
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 100, emojiY + 50);
    ctx.lineTo(w / 2 + 100, emojiY + 50);
    ctx.stroke();

    // Nome do produto
    const nameY = isSquare ? 420 : 520;
    ctx.fillStyle = scheme.text;
    ctx.font = `bold ${isSquare ? 42 : 48}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    wrapText(ctx, product.productName.toUpperCase(), w / 2, nameY, contentW, 54);

    // Headline
    const headlineY = isSquare ? 540 : 680;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = `bold ${isSquare ? 36 : 40}px Inter, sans-serif`;
    wrapText(ctx, headline, w / 2, headlineY, contentW - 40, 48);

    // Benefício principal
    const benefitY = isSquare ? 700 : 900;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `${isSquare ? 28 : 32}px Inter, sans-serif`;
    wrapText(ctx, `✨ ${product.mainBenefit}`, w / 2, benefitY, contentW - 40, 42);

    // Preço
    const priceY = isSquare ? 840 : 1100;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const priceText = `R$ ${product.price}`;
    ctx.font = `bold ${isSquare ? 52 : 60}px Inter, sans-serif`;
    const priceW = ctx.measureText(priceText).width + 60;
    roundRect(ctx, w / 2 - priceW / 2, priceY - 40, priceW, 80, 40);
    ctx.fill();
    ctx.fillStyle = '#FDCB6E';
    ctx.fillText(priceText, w / 2, priceY + 16);

    // Botão CTA
    const ctaY = isSquare ? 940 : 1300;
    ctx.fillStyle = '#FFFFFF';
    const ctaText = 'QUERO COMEÇAR →';
    ctx.font = `bold ${isSquare ? 30 : 34}px Inter, sans-serif`;
    const ctaW = ctx.measureText(ctaText).width + 80;
    roundRect(ctx, w / 2 - ctaW / 2, ctaY - 25, ctaW, 65, 32);
    ctx.fill();
    ctx.fillStyle = scheme.bg;
    ctx.fillText(ctaText, w / 2, ctaY + 14);

    // Badge "ESPAÇO PARA CTA" (indicador)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = `bold ${isSquare ? 20 : 22}px Inter, sans-serif`;
    ctx.fillText('👆 Toque aqui para comprar', w / 2, isSquare ? 1030 : 1420);

    // Footer
    const footerY = isSquare ? 1050 : 1850;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${isSquare ? 20 : 22}px Inter, sans-serif`;
    ctx.fillText(`${product.productName} ©`, w / 2, footerY);

    return canvas.toDataURL('image/png', 0.92);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    const lines = [];

    for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    }
    if (line) lines.push(line);

    // Centralizar verticalmente se muitas linhas
    const totalHeight = lines.length * lineHeight;
    const startY = currentY - totalHeight / 2 + lineHeight / 2;

    lines.forEach((l, i) => {
        ctx.fillText(l, x, startY + i * lineHeight);
    });
}

// ===== GERAÇÃO PRINCIPAL =====

function generateCreatives(product) {
    const creatives = [];
    const usedSchemes = [];

    for (let i = 0; i < 5; i++) {
        // Esquema de cores único
        let scheme;
        do {
            scheme = getRandomItem(colorSchemes);
        } while (usedSchemes.includes(scheme.name) && usedSchemes.length < colorSchemes.length);
        usedSchemes.push(scheme.name);

        const tone = product.tone;
        const triggerIndex = i % triggers.length;
        const copy = generateCopy(product, tone, triggerIndex);
        const format = i < 3 ? 'square' : 'vertical';

        // Gerar imagem
        const imageData = generateImage(product, scheme, format, copy.headline, copy.trigger);

        creatives.push({
            id: i + 1,
            format,
            scheme,
            headline: copy.headline,
            cta: copy.cta,
            hook: copy.hook,
            fbCopy: copy.fbCopy,
            tiktokCopy: copy.tiktokCopy,
            organicCopy: copy.organicCopy,
            trigger: copy.trigger,
            imageData
        });
    }

    return creatives;
}

// ===== UI FUNCTIONS =====

function scrollToForm() {
    document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
}

function handleSubmit(e) {
    e.preventDefault();
    alert('Botão clicado! Formulário sendo processado...');

    if (credits <= 0) {
        showToast('❌ Sem créditos! Faça upgrade para continuar.', 'error');
        showPlanModal();
        return;
    }

    const product = {
        productName: document.getElementById('productName').value.trim(),
        productDesc: document.getElementById('productDesc').value.trim(),
        targetAudience: document.getElementById('targetAudience').value.trim(),
        mainBenefit: document.getElementById('mainBenefit').value.trim(),
        price: document.getElementById('price').value.trim(),
        tone: document.getElementById('tone').value
    };

    if (!product.productName || !product.productDesc || !product.targetAudience || !product.mainBenefit || !product.price || !product.tone) {
        showToast('❌ Preencha todos os campos!', 'error');
        return;
    }

    // Mostrar loading
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('loadingSection').scrollIntoView({ behavior: 'smooth' });

    startLoadingAnimation(product);
}

function startLoadingAnimation(product) {
    const steps = document.querySelectorAll('.loading-step');
    const bar = document.getElementById('loadingBar');
    let progress = 0;

    const stepTimes = [600, 1200, 2000, 2600];

    stepTimes.forEach((time, i) => {
        setTimeout(() => {
            steps.forEach((s, j) => {
                if (j < i) s.classList.add('done');
                if (j === i) s.classList.add('active');
                if (j > i) s.classList.remove('active');
            });
            progress = ((i + 1) / stepTimes.length) * 100;
            bar.style.width = progress + '%';
        }, time);
    });

    setTimeout(() => {
        generatedCreatives = generateCreatives(product);
        credits--;
        updateCreditsUI();
        saveState();

        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        renderResults(generatedCreatives);
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        showToast('✅ 5 criativos gerados com sucesso!');
    }, 3000);
}

function renderResults(creatives, filter = 'all') {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';

    const filtered = filter === 'all'
        ? creatives
        : filter === 'copies'
            ? creatives
            : creatives.filter(c => c.format === filter);

    if (filter === 'copies') {
        // Mostrar apenas copies
        creatives.forEach((c, i) => {
            const card = document.createElement('div');
            card.className = 'creative-card';
            card.innerHTML = `
                <div class="card-info">
                    <div class="card-type">✍️ Copy #${i + 1} — ${c.trigger.emoji} ${c.trigger.name}</div>
                    <div class="card-headline">${c.headline}</div>
                    <div class="card-actions">
                        <button class="card-btn" onclick="event.stopPropagation(); copyText('${encodeURIComponent(c.fbCopy)}')">📋 FB/IG</button>
                        <button class="card-btn" onclick="event.stopPropagation(); copyText('${encodeURIComponent(c.tiktokCopy)}')">🎵 TikTok</button>
                        <button class="card-btn" onclick="event.stopPropagation(); copyText('${encodeURIComponent(c.organicCopy)}')">📱 Orgânico</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        return;
    }

    filtered.forEach(creative => {
        const card = document.createElement('div');
        card.className = 'creative-card';
        card.setAttribute('data-format', creative.format);
        card.onclick = () => openDetail(creative);

        card.innerHTML = `
            <div class="card-preview ${creative.format === 'vertical' ? 'vertical' : ''}">
                <img src="${creative.imageData}" class="card-canvas" alt="Criativo ${creative.id}">
                <div class="card-badges">
                    <span class="card-badge">${creative.format === 'square' ? '📐 1080x1080' : '📱 1080x1920'}</span>
                </div>
            </div>
            <div class="card-info">
                <div class="card-type">Criativo #${creative.id} — ${creative.trigger.emoji} ${creative.trigger.name}</div>
                <div class="card-headline">${creative.headline}</div>
                <span class="card-trigger">${creative.trigger.emoji} ${creative.trigger.name}</span>
                <div class="card-actions">
                    <button class="card-btn" onclick="event.stopPropagation(); regenerateImage(${creative.id})">🔄 Nova Imagem</button>
                    <button class="card-btn" onclick="event.stopPropagation(); regenerateCopy(${creative.id})">✍️ Nova Copy</button>
                    <button class="card-btn primary" onclick="event.stopPropagation(); downloadSingle(${creative.id})">⬇️</button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

function switchTab(filter, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderResults(generatedCreatives, filter);
}

function openDetail(creative) {
    selectedCreative = creative;
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalBody');

    body.innerHTML = `
        <h2 style="margin-bottom:20px;font-size:24px;">Criativo #${creative.id}</h2>
        <div class="modal-detail-grid">
            <div class="modal-image-wrap">
                <img src="${creative.imageData}" alt="Criativo ${creative.id}">
            </div>
            <div class="modal-copy-wrap">
                <div class="modal-copy-section">
                    <h4>📋 Facebook/Instagram Ads</h4>
                    <pre>${creative.fbCopy}</pre>
                    <button class="copy-btn" onclick="copyText('${encodeURIComponent(creative.fbCopy)}')">📋 Copiar</button>
                </div>
                <div class="modal-copy-section">
                    <h4>🎵 TikTok Ads</h4>
                    <pre>${creative.tiktokCopy}</pre>
                    <button class="copy-btn" onclick="copyText('${encodeURIComponent(creative.tiktokCopy)}')">📋 Copiar</button>
                </div>
                <div class="modal-copy-section">
                    <h4>📱 Legenda Orgânica</h4>
                    <pre>${creative.organicCopy}</pre>
                    <button class="copy-btn" onclick="copyText('${encodeURIComponent(creative.organicCopy)}')">📋 Copiar</button>
                </div>
                <div class="modal-regen-actions">
                    <button class="modal-regen-btn" onclick="regenerateImage(${creative.id}); closeModal();">🔄 Regenerar Imagem</button>
                    <button class="modal-regen-btn" onclick="regenerateCopy(${creative.id}); closeModal();">✍️ Regenerar Copy</button>
                    <button class="modal-regen-btn" onclick="downloadSingle(${creative.id})">⬇️ Baixar Imagem</button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('show');
}

function showPlanModal() {
    document.getElementById('planModal').classList.add('show');
}

function closePlanModal() {
    document.getElementById('planModal').classList.remove('show');
}

function selectPlan(plan) {
    if (plan === 'pro') {
        credits = 50;
        currentPlan = 'pro';
        showToast('✅ Plano Pro ativado! 50 créditos disponíveis.');
    } else if (plan === 'business') {
        credits = 999;
        currentPlan = 'business';
        showToast('✅ Plano Business ativado! Créditos ilimitados.');
    }
    updateCreditsUI();
    saveState();
    closePlanModal();
}

function updateCreditsUI() {
    document.getElementById('creditsCount').textContent = currentPlan === 'business' ? '∞' : credits;
}

function copyText(encoded) {
    const text = decodeURIComponent(encoded);
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Copy copiada!');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('📋 Copy copiada!');
    });
}

function regenerateImage(id) {
    const creative = generatedCreatives.find(c => c.id === id);
    if (!creative) return;

    const product = {
        productName: document.getElementById('productName').value.trim(),
        productDesc: document.getElementById('productDesc').value.trim(),
        targetAudience: document.getElementById('targetAudience').value.trim(),
        mainBenefit: document.getElementById('mainBenefit').value.trim(),
        price: document.getElementById('price').value.trim(),
        tone: document.getElementById('tone').value
    };

    let newScheme;
    do {
        newScheme = getRandomItem(colorSchemes);
    } while (newScheme.name === creative.scheme.name);

    creative.scheme = newScheme;
    creative.imageData = generateImage(product, newScheme, creative.format, creative.headline, creative.trigger);

    const activeTab = document.querySelector('.tab.active');
    const filter = activeTab ? activeTab.textContent.trim() : 'all';
    renderResults(generatedCreatives, filter === 'Todos' ? 'all' : filter === '📐 Quadrado' ? 'square' : filter === '📱 Vertical' ? 'vertical' : 'copies');
    showToast('🔄 Imagem regenerada!');
}

function regenerateCopy(id) {
    const creative = generatedCreatives.find(c => c.id === id);
    if (!creative) return;

    const product = {
        productName: document.getElementById('productName').value.trim(),
        productDesc: document.getElementById('productDesc').value.trim(),
        targetAudience: document.getElementById('targetAudience').value.trim(),
        mainBenefit: document.getElementById('mainBenefit').value.trim(),
        price: document.getElementById('price').value.trim(),
        tone: document.getElementById('tone').value
    };

    const newCopy = generateCopy(product, product.tone, creative.triggerIndex || 0);
    creative.headline = newCopy.headline;
    creative.cta = newCopy.cta;
    creative.hook = newCopy.hook;
    creative.fbCopy = newCopy.fbCopy;
    creative.tiktokCopy = newCopy.tiktokCopy;
    creative.organicCopy = newCopy.organicCopy;

    // Regenerar imagem com novo headline
    creative.imageData = generateImage(product, creative.scheme, creative.format, creative.headline, creative.trigger);

    const activeTab = document.querySelector('.tab.active');
    const filter = activeTab ? activeTab.textContent.trim() : 'all';
    renderResults(generatedCreatives, filter === 'Todos' ? 'all' : filter === '📐 Quadrado' ? 'square' : filter === '📱 Vertical' ? 'vertical' : 'copies');
    showToast('✍️ Copy regenerada!');
}

function downloadSingle(id) {
    const creative = generatedCreatives.find(c => c.id === id);
    if (!creative) return;

    const link = document.createElement('a');
    link.download = `criative-ia-${id}-${creative.format}.png`;
    link.href = creative.imageData;
    link.click();
    showToast('⬇️ Imagem baixada!');
}

function downloadAll() {
    if (currentPlan === 'free') {
        showToast('❌ Download em pacote disponível nos planos Pro e Business.', 'error');
        showPlanModal();
        return;
    }

    // Baixar cada imagem
    generatedCreatives.forEach((c, i) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `criative-ia-${c.id}-${c.format}.png`;
            link.href = c.imageData;
            link.click();
        }, i * 300);
    });

    // Gerar arquivo de texto com todas as copies
    setTimeout(() => {
        let textContent = '═══════════════════════════════════════\n';
        textContent += '  CRIATIVE.IA — SEUS CRIATIVOS PRONTOS\n';
        textContent += '═══════════════════════════════════════\n\n';

        generatedCreatives.forEach((c, i) => {
            textContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            textContent += `  CRIATIVO #${c.id} — ${c.trigger.emoji} ${c.trigger.name}\n`;
            textContent += `  Formato: ${c.format === 'square' ? '1080x1080' : '1080x1920'}\n`;
            textContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            textContent += `📋 FACEBOOK/INSTAGRAM ADS:\n`;
            textContent += `─────────────────────────────\n`;
            textContent += `Headline: ${c.headline}\n`;
            textContent += `CTA: ${c.cta}\n\n`;
            textContent += `Texto Principal:\n${c.fbCopy}\n\n`;

            textContent += `🎵 TIKTOK ADS:\n`;
            textContent += `─────────────────────────────\n`;
            textContent += `${c.tiktokCopy}\n\n`;

            textContent += `📱 LEGENDA ORGÂNICA:\n`;
            textContent += `─────────────────────────────\n`;
            textContent += `${c.organicCopy}\n\n`;
        });

        textContent += `\n═══════════════════════════════════════\n`;
        textContent += '  Gerado por Criative.IA\n';
        textContent += '═══════════════════════════════════════\n';

        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'criative-ia-copies.txt';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }, generatedCreatives.length * 300 + 200);

    showToast('📦 Pacote baixado! Imagens + Copies');
}

function resetForm() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('formSection').style.display = 'block';
    document.getElementById('creativeForm').reset();
    document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
}

// Fechar modais com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closePlanModal();
    }
});

// Fechar modal clicando fora
document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

document.getElementById('planModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closePlanModal();
});

// ===== LOGIN E ESTADO VIA SUPABASE =====

async function loadState() {
    userEmail = localStorage.getItem('criativeia_email');
    if (!userEmail) {
        userEmail = prompt('Digite seu e-mail para começar:');
        if (userEmail) localStorage.setItem('criativeia_email', userEmail);
    }
    if (!userEmail) { updateCreditsUI(); return; }

    let { data } = await supabase.from('usuarios').select('*').eq('email', userEmail).single();

    if (!data) {
        const { data: novo } = await supabase.from('usuarios')
            .insert([{ email: userEmail, plano: 'gratis', creditos: 3 }])
            .select().single();
        data = novo;
    }

    if (data) {
        credits = data.creditos;
        currentPlan = data.plano === 'gratis' ? 'free' : data.plano;
    }
    updateCreditsUI();
}

async function saveState() {
    if (!userEmail) return;
    await supabase.from('usuarios').update({
        creditos: credits,
        plano: currentPlan === 'free' ? 'gratis' : currentPlan
    }).eq('email', userEmail);
}

// Init
loadState();
