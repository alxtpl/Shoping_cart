// Optimized cart component with cleaner structure and reusable functions
const { useState, useEffect } = React;
const { Container, Row, Col, Button, Card } = ReactBootstrap;

const Products = () => {
  const [cart, setCart] = useState([]);
  const [productList, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]);

  // Fetch products from Strapi
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:1337/api/products");
      const products = response.data?.data || [];
      setProducts(products);
      setOriginalProducts(products);
      console.log("Products fetched successfully:", products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  // Sync product list with the server
  const syncProductsWithServer = async () => {
    try {
      await Promise.all(
        productList.map(async (product) => {
          const { documentId, instock } = product;
          const requestBody = { data: { instock } };
          console.log(`Syncing ${product.name}: Stock = ${instock}`);
          await axios.put(
            `http://localhost:1337/api/products/${documentId}`,
            requestBody
          );
        })
      );
      console.log("Product synchronization complete.");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  // Handle checkout
  const checkOut = async () => {
    console.log("Checking out with cart:", cart);
    await syncProductsWithServer();
    setCart([]);
  };

  // Handle restock
  const restockProducts = async () => {
    try {
      console.log("Restocking products...");
      const requests = originalProducts.map((item) => {
        const requestBody = { data: { instock: item.instock } };
        return axios.put(
          `http://localhost:1337/api/products/${item.documentId}`,
          requestBody
        );
      });
      await Promise.all(requests);
      setProducts(originalProducts);
      setCart([]);
      console.log("Restock successful and cart cleared");
    } catch (error) {
      console.error("Failed to restock products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Update stock count in UI
  const updateStockInUI = (documentId, delta) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.documentId === documentId ? { ...p, instock: p.instock + delta } : p
      )
    );
  };

  // Add to cart
  const addToCart = (product) => {
    if (product.instock === 0) return;
    updateStockInUI(product.documentId, -1);
    setCart((prevCart) => [...prevCart, product]);
  };

  // Remove from cart
  const deleteCartItem = (index) => {
    const item = cart[index];
    updateStockInUI(item.documentId, 1);
    setCart(cart.filter((_, i) => i !== index));
  };

  const renderProductCard = (product, index) => (
    <Card key={index} style={{ width: "18rem", margin: "10px" }}>
      <Card.Body>
        <Card.Title>{product.name}</Card.Title>
        <Card.Text>Price: ${product.cost}</Card.Text>
        <Card.Text>In Stock: {product.instock}</Card.Text>
        <Button
          onClick={() => addToCart(product)}
          disabled={product.instock === 0}
        >
          {product.instock > 0 ? "Add to Cart" : "Out of Stock"}
        </Button>
      </Card.Body>
    </Card>
  );

  const renderCartCard = (item, index) => (
    <Card key={index} style={{ margin: "10px" }}>
      <Card.Body>
        <Card.Title>
          {item.name} - ${item.cost}
        </Card.Title>
        <Card.Text>From: {item.country}</Card.Text>
        <Button variant="danger" onClick={() => deleteCartItem(index)}>
          Remove from Cart
        </Button>
      </Card.Body>
    </Card>
  );

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {productList.map(renderProductCard)}
          </div>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <div>{cart.map(renderCartCard)}</div>
        </Col>
        <Col>
          <h1>Checkout and Restock</h1>
          <Button onClick={checkOut}>Checkout</Button>
          <form
            onSubmit={(e) => {
              restockProducts();
              e.preventDefault();
            }}
          >
            <button type="submit">Restock Products</button>
          </form>
        </Col>
      </Row>
    </Container>
  );
};

ReactDOM.render(<Products />, document.getElementById("root"));
