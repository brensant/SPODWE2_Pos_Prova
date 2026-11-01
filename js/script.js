import { produtos, categorias } from './produtos.js';
import { ShoppingCart } from './ShoppingCart.js';

const articleGrid = document.getElementById('article-grid');
const filters = document.getElementById('filters');
const searchInput = document.getElementById('buscar');
const resultsCount = document.getElementById('results-count');
const themeToggle = document.getElementById('theme-toggle');

const cart = new ShoppingCart(produtos);
const cartDrawer = document.getElementById('cart');
const cartOverlay = document.getElementById('cart-overlay');
const openCartButton = document.getElementById('open-cart');
const closeCartButton = document.getElementById('close-cart');
const clearCartButton = document.getElementById('clear-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartItemsDescription = document.getElementById('cart-items-description');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotal = document.getElementById('cart-total');
const finishOrderButton = document.getElementById('finish-order');
const toast = document.getElementById('toast');
const newsletterForm = document.getElementById('newsletter-form');

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

let selectedCategory = 'all';
let previouslyFocusedElement = null;
let toastTimeout = null;

initialize();

/**
 * Função "principal", executada ao carregar a página.
 *
 * Configura todas as funcionalidades do site.
 */
function initialize() {
	renderProductGrid();
	setupFilters();
	setupSearch();
	setupTheme();
	setupCartEvents();
	setupNewsletter();
	renderCart();
	filterProducts();
}

function renderProductGrid() {
	const fragment = document.createDocumentFragment();

	produtos.forEach((product) => {
		fragment.append(createProductCard(product));
	});

	articleGrid.replaceChildren(fragment);
}

function createProductCard(product) {
	const card = document.createElement('article');
	const category = categorias[product.categoria];
	const ratingStars = `${'★'.repeat(product.avaliacao)}${'☆'.repeat(5 - product.avaliacao)}`;

	card.className = 'article-card';
	card.dataset.category = String(product.categoria);
	card.dataset.search = normalizeText(`${product.nome} ${category.printName}`);

	card.innerHTML = `
		<img
			class="article-card__img"
			src="${product.img_url}"
			alt="${product.img_alt}"
			loading="lazy"
			decoding="async"
		>
		<span class="article-card__tag tag-${category.symbolName}">${category.printName}</span>
		<h3 class="article-card__title">${product.nome}</h3>
		<p class="article-card__rating" role="img" aria-label="Avaliação: ${product.avaliacao} de 5 estrelas">
			<span class="article-card__rating--active" aria-hidden="true">${ratingStars}</span>
			<span aria-hidden="true"> ${product.avaliacao}/5</span>
		</p>
		<p class="article-card__price">${formatCurrency(product.preco)}</p>
		<button class="article-card__button" type="button" data-product-id="${product.id}">
			Adicionar ao carrinho
		</button>
	`;

	card.querySelector('.article-card__button').addEventListener('click', () => {
		cart.addItem(product.id);
		renderCart();
		showToast(`${product.nome} adicionado ao carrinho.`);
	});

	return card;
}

/* Filtro por categoria */
function setupFilters() {
	filters.addEventListener('click', (event) => {
		const button = event.target.closest('.filters-tag');

		if (!button) return;

		selectedCategory = button.dataset.category;
		updateFilterAppearance();
		filterProducts();
	});
}

function updateFilterAppearance() {
	filters.querySelectorAll('.filters-tag').forEach((button) => {
		const isActive = button.dataset.category === selectedCategory;
		button.classList.toggle('is-active', isActive);
		button.setAttribute('aria-pressed', String(isActive));
	});
}

/* Busca por nome e categoria */
function setupSearch() {
	searchInput.addEventListener('input', filterProducts);
}

function setupTheme() {
	const savedTheme = readSavedTheme();
	const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const initialTheme = savedTheme ?? (systemPrefersDark ? 'dark' : 'light');

	setTheme(initialTheme);

	themeToggle.addEventListener('click', () => {
		const currentTheme = document.documentElement.dataset.theme;
		const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

		setTheme(nextTheme);
		try {
			localStorage.setItem('theme', nextTheme);
		} catch (error) {
			console.warn('Não foi possível salvar a preferência de tema:', error);
		}
	});

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
		if (readSavedTheme() === null) {
			setTheme(event.matches ? 'dark' : 'light');
		}
	});
}


/* Carrinho */
function setupCartEvents() {
	openCartButton.addEventListener('click', openCart);
	closeCartButton.addEventListener('click', closeCart);
	cartOverlay.addEventListener('click', closeCart);
	clearCartButton.addEventListener('click', () => {
		cart.clear();
		renderCart();
		showToast('Carrinho esvaziado.');
	});

	cartItemsContainer.addEventListener('click', (event) => {
		const button = event.target.closest('button[data-action]');
		if (!button) return;

		const productId = Number(button.dataset.productId);
		const action = button.dataset.action;

		if (action === 'increase') {
			const item = cart.getItems().find((cartItem) => cartItem.id === productId);
			if (item) cart.updateQuantity(productId, item.quantidade + 1);
		} else if (action === 'decrease') {
			const item = cart.getItems().find((cartItem) => cartItem.id === productId);
			if (item && item.quantidade > 1) {
				cart.updateQuantity(productId, item.quantidade - 1);
			}
		} else if (action === 'remove') {
			cart.removeItem(productId);
			showToast('Produto removido do carrinho.');
		}

		renderCart();
	});

	finishOrderButton.addEventListener('click', () => {
		if (cart.getItemCount() === 0) return;

		cart.clear();
		renderCart();
		closeCart();
		showToast('Pedido de demonstração finalizado. Nenhum pagamento foi realizado.');
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && cartDrawer.classList.contains('is-open')) {
			closeCart();
		}

		// Mantém o foco dentro do painel enquanto ele estiver aberto.
		if (event.key === 'Tab' && cartDrawer.classList.contains('is-open')) {
			trapDrawerFocus(event);
		}
	});
}

function setupNewsletter() {
	newsletterForm.addEventListener('submit', (event) => {
		event.preventDefault();

		if (!newsletterForm.reportValidity()) return;

		showToast('Inscrição de demonstração recebida.');
		newsletterForm.reset();
	});
}

function renderCart() {
	const items = cart.getItems();
	const itemCount = cart.getItemCount();
	const subtotal = cart.getSubtotal();
	const formattedCount = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;

	cartCount.textContent = String(itemCount);
	openCartButton.setAttribute('aria-label', `Abrir carrinho, ${formattedCount}`);
	cartItemsDescription.textContent = `${items.length} ${items.length === 1 ? 'produto diferente' : 'produtos diferentes'} · ${formattedCount}`;
	cartSubtotal.textContent = formatCurrency(subtotal);
	cartTotal.textContent = formatCurrency(subtotal);

	clearCartButton.disabled = items.length === 0;
	finishOrderButton.disabled = items.length === 0;
	cartItemsContainer.replaceChildren();

	if (items.length === 0) {
		const emptyMessage = document.createElement('div');
		emptyMessage.className = 'cart-empty';
		emptyMessage.innerHTML = `
			<span class="cart-empty__icon" aria-hidden="true">♪</span>
			<strong>Seu carrinho está vazio</strong>
			<span>Adicione instrumentos do catálogo para começar.</span>
		`;
		cartItemsContainer.append(emptyMessage);
		return;
	}

	const fragment = document.createDocumentFragment();
	items.forEach((item) => fragment.append(createCartItem(item)));
	cartItemsContainer.append(fragment);
}

function filterProducts() {
	const searchTerm = normalizeText(searchInput.value);
	const cards = articleGrid.querySelectorAll('.article-card');
	let visibleCount = 0;

	cards.forEach((card) => {
		const matchesCategory = selectedCategory === 'all'
			|| card.dataset.category === selectedCategory;
		const matchesSearch = card.dataset.search.includes(searchTerm);
		const isVisible = matchesCategory && matchesSearch;

		card.hidden = !isVisible;
		if (isVisible) visibleCount += 1;
	});

	resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'produto encontrado' : 'produtos encontrados'}`;

	const existingMessage = articleGrid.querySelector('.no-results');
	if (existingMessage) existingMessage.remove();

	if (visibleCount === 0) {
		const message = document.createElement('p');
		message.className = 'no-results';
		message.textContent = 'Nenhum produto corresponde à sua busca.';
		articleGrid.append(message);
	}
}


function createCartItem(item) {
	const cartItem = document.createElement('article');
	const itemTotal = item.preco * item.quantidade;

	cartItem.className = 'cart-item';
	cartItem.innerHTML = `
		<img class="cart-item__image" src="${item.img_url}" alt="${item.img_alt}" loading="lazy">
		<div class="cart-item__content">
			<div class="cart-item__topline">
				<div>
					<h3 class="cart-item__name">${item.nome}</h3>
					<p class="cart-item__unit-price">${formatCurrency(item.preco)} cada</p>
				</div>
				<button
					type="button"
					class="cart-item__remove"
					data-action="remove"
					data-product-id="${item.id}"
					aria-label="Remover ${item.nome} do carrinho"
					title="Remover produto"
				>x</button>
			</div>
			<div class="cart-item__bottomline">
				<div class="quantity-control" aria-label="Quantidade de ${item.nome}">
					<button
						type="button"
						class="quantity-control__button"
						data-action="decrease"
						data-product-id="${item.id}"
						aria-label="Diminuir quantidade de ${item.nome}"
						${item.quantidade <= 1 ? 'disabled' : ''}
					>-</button>
					<span class="quantity-control__value" aria-live="polite">${item.quantidade}</span>
					<button
						type="button"
						class="quantity-control__button"
						data-action="increase"
						data-product-id="${item.id}"
						aria-label="Aumentar quantidade de ${item.nome}"
					>+</button>
				</div>
				<strong class="cart-item__total">${formatCurrency(itemTotal)}</strong>
			</div>
		</div>
	`;

	return cartItem;
}

function openCart() {
	if (cartDrawer.classList.contains('is-open')) return;

	previouslyFocusedElement = document.activeElement;
	cartOverlay.hidden = false;
	cartDrawer.inert = false;
	cartDrawer.setAttribute('aria-hidden', 'false');
	cartDrawer.classList.add('is-open');
	document.body.classList.add('cart-open');
	openCartButton.setAttribute('aria-expanded', 'true');

	requestAnimationFrame(() => cartOverlay.classList.add('is-visible'));
	closeCartButton.focus();
}

function closeCart() {
	if (!cartDrawer.classList.contains('is-open')) return;

	cartDrawer.classList.remove('is-open');
	cartOverlay.classList.remove('is-visible');
	cartDrawer.setAttribute('aria-hidden', 'true');
	cartDrawer.inert = true;
	document.body.classList.remove('cart-open');
	openCartButton.setAttribute('aria-expanded', 'false');

	window.setTimeout(() => {
		if (!cartDrawer.classList.contains('is-open')) cartOverlay.hidden = true;
	}, 270);

	if (previouslyFocusedElement instanceof HTMLElement) {
		previouslyFocusedElement.focus();
	} else {
		openCartButton.focus();
	}
}

function trapDrawerFocus(event) {
	const focusableElements = cartDrawer.querySelectorAll(
		'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
	);
	const firstElement = focusableElements[0];
	const lastElement = focusableElements[focusableElements.length - 1];

	if (!firstElement || !lastElement) return;

	if (event.shiftKey && document.activeElement === firstElement) {
		event.preventDefault();
		lastElement.focus();
	} else if (!event.shiftKey && document.activeElement === lastElement) {
		event.preventDefault();
		firstElement.focus();
	}
}

/* Tema claro/escuro: respeita a escolha salva ou a preferência do sistema. */
function readSavedTheme() {
	try {
		return localStorage.getItem('theme');
	} catch {
		return null;
	}
}

function setTheme(theme) {
	const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
	const isDark = normalizedTheme === 'dark';

	document.documentElement.dataset.theme = normalizedTheme;
	themeToggle.querySelector('span').textContent = isDark ? '☀' : '☾';
	themeToggle.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
	themeToggle.title = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';
}

/**
 * Exibe um aviso rápido de confirmação.
 */
function showToast(message) {
	toast.textContent = message;
	toast.classList.add('is-visible');

	window.clearTimeout(toastTimeout);
	toastTimeout = window.setTimeout(() => {
		toast.classList.remove('is-visible');
	}, 2800);
}

function formatCurrency(value) {
	return currencyFormatter.format(value);
}

function normalizeText(value) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}
