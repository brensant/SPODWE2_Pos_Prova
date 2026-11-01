/**
 * Carrinho de compras com persistência local.
 *
 * O carrinho armazena apenas o ID do produto e sua quantidade.
 * Os dados descritivos e os preços continuam vindo do catálogo.
 */
export class ShoppingCart {
	#products;
	#items;
	#storageKey;

	constructor(products, storageKey = 'shoppingCart') {
		if (!Array.isArray(products)) {
			throw new TypeError('O catálogo de produtos deve ser um array.');
		}

		this.#products = new Map(products.map((product) => [Number(product.id), product]));
		this.#storageKey = storageKey;
		this.#items = this.#load();
	}

	/*
	 * Retorna os itens do carrinho com os dados atuais do catálogo.
	 */
	getItems() {
		return this.#items.map(({ id, quantidade }) => ({
			...this.#products.get(id),
			quantidade,
		}));
	}

	/**
	 * Retorna a soma das quantidades de todos os produtos.
	 */
	getItemCount() {
		return this.#items.reduce((total, item) => total + item.quantidade, 0);
	}

	/*
	 * Adiciona uma unidade ou incrementa a quantidade de um produto existente.
	 */
	addItem(productId) {
		const id = Number(typeof productId === 'object' ? productId?.id : productId);

		if (!this.#products.has(id)) {
			throw new Error(`Produto com ID ${id} não encontrado no catálogo.`);
		}

		const item = this.#items.find((cartItem) => cartItem.id === id);

		if (item) {
			item.quantidade += 1;
		} else {
			this.#items.push({ id, quantidade: 1 });
		}

		this.#save();
	}

	/*
	 * Define uma quantidade inteira positiva para um produto do carrinho.
	 */
	updateQuantity(productId, quantity) {
		const id = Number(productId);
		const normalizedQuantity = Number(quantity);

		if (!Number.isInteger(normalizedQuantity)) {
			throw new TypeError('A quantidade deve ser um número inteiro.');
		}

		const index = this.#items.findIndex((item) => item.id === id);

		if (index === -1) {
			return;
		}

		if (normalizedQuantity <= 0) {
			this.removeItem(id);
			return;
		}

		this.#items[index].quantidade = normalizedQuantity;
		this.#save();
	}

	/*
	 * Remove um produto, independentemente de sua quantidade.
	 */
	removeItem(productId) {
		const id = Number(typeof productId === 'object' ? productId?.id : productId);
		const initialLength = this.#items.length;

		this.#items = this.#items.filter((item) => item.id !== id);

		if (this.#items.length !== initialLength) {
			this.#save();
		}
	}

	/*
	 * Esvazia o carrinho.
	 */
	clear() {
		this.#items = [];
		this.#save();
	}

	/*
	 * Calcula subtotal em centavos para reduzir erros de ponto flutuante.
	 */
	getSubtotal() {
		const subtotalInCents = this.#items.reduce((total, item) => {
			const product = this.#products.get(item.id);
			const priceInCents = Math.round(Number(product.preco) * 100);
			return total + priceInCents * item.quantidade;
		}, 0);

		return subtotalInCents / 100;
	}

	#load() {
		try {
			const storedData = localStorage.getItem(this.#storageKey);

			if (!storedData) {
				return [];
			}

			const parsedData = JSON.parse(storedData);

			if (!Array.isArray(parsedData)) {
				return [];
			}

			// Também aceita o formato antigo, que salvava o objeto completo do produto.
			const quantitiesById = new Map();

			parsedData.forEach((storedItem) => {
				const id = Number(storedItem?.id);
				const quantidade = Number(storedItem?.quantidade);

				if (
					this.#products.has(id)
					&& Number.isInteger(quantidade)
					&& quantidade > 0
				) {
					quantitiesById.set(id, (quantitiesById.get(id) ?? 0) + quantidade);
				}
			});

			return Array.from(quantitiesById, ([id, quantidade]) => ({ id, quantidade }));
		} catch (error) {
			// Armazenamento indisponível ou conteúdo inválido: inicia com carrinho vazio.
			console.warn('Não foi possível recuperar o carrinho salvo:', error);
			return [];
		}
	}

	#save() {
		try {
			localStorage.setItem(this.#storageKey, JSON.stringify(this.#items));
		} catch (error) {
			// O carrinho continua utilizável durante a sessão mesmo se o navegador
			// bloquear o armazenamento local.
			console.warn('Não foi possível salvar o carrinho:', error);
		}
	}
}
