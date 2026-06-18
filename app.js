/* app.js */

// ==========================================
// STATE MANAGEMENT
// ==========================================
let cart = [];
let activeTeaType = 'black';
let timerInterval = null;
let timeRemaining = 240; // 4 minutes in seconds
let targetTimeSeconds = 240;
let isTimerRunning = false;
let currentTestimonialSlide = 0;

// Brewing Guide Database
const teaBrewingData = {
  black: {
    title: "Organic Assam Black",
    origin: "Sourced from Assam, India",
    desc: "Rich, malty, and full-bodied. Black tea leaves are fully oxidized and require near-boiling water to fully release their complex tannins, dark honeyed notes, and natural robustness.",
    temp: "208°F / 98°C",
    time: 240, // 4 minutes
    textTime: "4 Minutes"
  },
  green: {
    title: "Organic Tropical Green",
    origin: "Sourced from Zhejiang Province, China",
    desc: "Light, grassy, and refreshingly sweet with natural mango and pineapple infusion. Green tea leaves are unoxidized and require cooler water to prevent cooking the leaves and causing bitterness.",
    temp: "175°F / 80°C",
    time: 180, // 3 minutes
    textTime: "3 Minutes"
  },
  herbal: {
    title: "Organic Chamomile & Peppermint",
    origin: "Sourced from Washington State, USA",
    desc: "Pure botanical flowers and leaves. Herbal infusions contain no actual tea leaves and benefit from a full rolling boil and longer steeping times to extract all therapeutic essential oils.",
    temp: "212°F / 100°C",
    time: 300, // 5 minutes
    textTime: "5 Minutes"
  },
  chai: {
    title: "Mountain High Chai",
    origin: "Sourced from Nilgiri, India",
    desc: "A warm, invigorating blend of black tea, ginger, cardamom, cinnamon, and cloves. Brews exceptionally strong, making it the perfect base for honey and milk in a classic Chai Latte.",
    temp: "208°F / 98°C",
    time: 300, // 5 minutes
    textTime: "5 Minutes"
  }
};

// ==========================================
// DOM ELEMENT REFERENCES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Sticky Header
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile navigation drawer
  const burgerBtn = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');

  const toggleMobileMenu = () => {
    burgerBtn.classList.toggle('active');
    mobileDrawer.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
  };

  burgerBtn.addEventListener('click', toggleMobileMenu);
  mobileOverlay.addEventListener('click', toggleMobileMenu);
  window.toggleMobileMenu = toggleMobileMenu; // Expose globally for onclick handlers

  // Search Modal Overlay
  const searchOpenBtn = document.getElementById('search-open-btn');
  const searchCloseBtn = document.getElementById('search-close-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchInputField = document.getElementById('search-input-field');

  if (searchOpenBtn && searchOverlay && searchInputField) {
    searchOpenBtn.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      setTimeout(() => searchInputField.focus(), 100);
    });
  }

  if (searchCloseBtn && searchOverlay) {
    searchCloseBtn.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
    });
  }

  // Global Mock Search function
  window.triggerSearchMock = (term) => {
    searchOverlay.classList.remove('active');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Simulate a filter action based on search term
    let filterCategory = 'all';
    if (term.toLowerCase().includes('berry') || term.toLowerCase().includes('herbal')) {
      filterCategory = 'herbal';
    } else if (term.toLowerCase().includes('green')) {
      filterCategory = 'green';
    } else if (term.toLowerCase().includes('chai') || term.toLowerCase().includes('black')) {
      filterCategory = 'black';
    }

    // Click matching filter button
    filterBtns.forEach(btn => {
      if (btn.dataset.filter === filterCategory) {
        btn.click();
      }
    });

    // Scroll to shop
    document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  };

  // ==========================================
  // PRODUCT CATALOG FILTER
  // ==========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active states
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      // Filter product catalog with animations
      productCards.forEach(card => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.classList.add('hidden');
          }, 300);
        }
      });
    });
  });

  // ==========================================
  // SHOPPING CART DRAWER LOGIC
  // ==========================================
  const cartOpenBtn = document.getElementById('cart-open-btn');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartBadge = document.getElementById('cart-badge-count');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartSubtotalVal = document.getElementById('cart-subtotal-val');

  const toggleCartDrawer = () => {
    cartDrawer.classList.toggle('active');
    cartOverlay.classList.toggle('active');
  };

  cartOpenBtn.addEventListener('click', toggleCartDrawer);
  cartCloseBtn.addEventListener('click', toggleCartDrawer);
  cartOverlay.addEventListener('click', toggleCartDrawer);
  window.toggleCartDrawer = toggleCartDrawer; // Expose globally

  // Add Item to Cart Event Listener
  const addBtnElements = document.querySelectorAll('.add-to-cart-btn');
  addBtnElements.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      const price = parseFloat(btn.dataset.price);
      const img = btn.dataset.img;
      addToCart(id, title, price, img);
    });
  });

  const addToCart = (id, title, price, img) => {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({ id, title, price, img, qty: 1 });
    }

    updateCartUI();
    
    // Open cart drawer so user sees their item added
    if (!cartDrawer.classList.contains('active')) {
      toggleCartDrawer();
    }

    // Bounce cart badge badge
    cartBadge.classList.add('pop');
    setTimeout(() => cartBadge.classList.remove('pop'), 300);
  };

  const updateCartUI = () => {
    // Update Badge Count
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalQty;

    // Render items
    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="cart-empty-message">
          <i class="fa-solid fa-basket-shopping"></i>
          <p>Your shopping cart is currently empty.</p>
          <button class="btn btn-primary" onclick="toggleCartDrawer()">Shop Our Teas</button>
        </div>
      `;
      cartSubtotalVal.textContent = "$0.00";
      return;
    }

    let itemsHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
      const itemCost = item.price * item.qty;
      subtotal += itemCost;

      itemsHTML += `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${item.img}" alt="${item.title}">
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.title}</h4>
            <span class="cart-item-price">$${item.price.toFixed(2)}</span>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="updateQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
          <button class="remove-item-btn" onclick="removeItem('${item.id}')">Remove</button>
        </div>
      `;
    });

    cartItemsList.innerHTML = itemsHTML;
    cartSubtotalVal.textContent = `$${subtotal.toFixed(2)}`;
  };

  // Update Item Quantity in Cart
  window.updateQty = (id, change) => {
    const item = cart.find(item => item.id === id);
    if (!item) return;

    item.qty += change;
    if (item.qty <= 0) {
      removeItem(id);
    } else {
      updateCartUI();
    }
  };

  // Remove Item from Cart
  window.removeItem = (id) => {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
  };

  // ==========================================
  // INTERACTIVE BREWING GUIDE TIMER
  // ==========================================
  const brewTabBtns = document.querySelectorAll('.brew-tab-btn');
  const brewInfoContainer = document.getElementById('brew-info-content');
  const brewTempText = document.getElementById('brew-temp');
  const brewTimeText = document.getElementById('brew-time');
  
  const timerDisplay = document.getElementById('timer-display');
  const timerStartBtn = document.getElementById('timer-start-btn');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const timerProgressCircle = document.getElementById('timer-progress');

  // Handle Tea Tab Clicks
  brewTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      brewTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeTeaType = btn.dataset.tea;
      const data = teaBrewingData[activeTeaType];

      // Update Info Panel
      brewInfoContainer.innerHTML = `
        <h3 class="brew-type-title text-serif">${data.title}</h3>
        <span class="brew-type-origin">${data.origin}</span>
        <p class="brew-type-desc">${data.desc}</p>
        
        <div class="brew-stats-grid">
          <div class="brew-stat">
            <span class="brew-stat-label">Water Temp</span>
            <span class="brew-stat-value" id="brew-temp">${data.temp}</span>
          </div>
          <div class="brew-stat">
            <span class="brew-stat-label">Steep Time</span>
            <span class="brew-stat-value" id="brew-time">${data.textTime}</span>
          </div>
          <div class="brew-stat">
            <span class="brew-stat-label">Water Vol</span>
            <span class="brew-stat-value">8 oz / 240ml</span>
          </div>
        </div>
      `;

      // Reset Timer State for new tea
      resetTimer();
    });
  });

  const updateTimerDisplay = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update SVG Circular progress
    const circumference = 502; // stroke-dasharray value
    const progress = timeRemaining / targetTimeSeconds;
    const offset = circumference * (1 - progress);
    timerProgressCircle.style.strokeDashoffset = offset;
  };

  const startTimer = () => {
    if (isTimerRunning) {
      // Pause
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerStartBtn.textContent = "Resume Steep";
      timerStartBtn.style.backgroundColor = "var(--brand-green)";
    } else {
      // Start
      isTimerRunning = true;
      timerStartBtn.textContent = "Pause";
      timerStartBtn.style.backgroundColor = "var(--brand-accent)";
      
      timerInterval = setInterval(() => {
        timeRemaining -= 1;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
          clearInterval(timerInterval);
          isTimerRunning = false;
          timerStartBtn.textContent = "Enjoy Tea!";
          timerStartBtn.style.backgroundColor = "var(--success-color)";
          timerStartBtn.disabled = true;
          // Play a mock sound/alert
          alert("🍵 Your tea has completed steeping! Enjoy the perfect brew.");
        }
      }, 1000);
    }
  };

  const resetTimer = () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    
    const data = teaBrewingData[activeTeaType];
    targetTimeSeconds = data.time;
    timeRemaining = data.time;
    
    timerStartBtn.disabled = false;
    timerStartBtn.textContent = "Start Steep";
    timerStartBtn.style.backgroundColor = "var(--brand-green)";
    
    updateTimerDisplay();
  };

  timerStartBtn.addEventListener('click', startTimer);
  timerResetBtn.addEventListener('click', resetTimer);

  // Initial timer setup
  resetTimer();

  // ==========================================
  // TESTIMONIAL CAROUSEL SLIDER
  // ==========================================
  const testimonialTrack = document.getElementById('testimonial-track');
  const prevBtn = document.getElementById('slider-prev-btn');
  const nextBtn = document.getElementById('slider-next-btn');
  const slides = document.querySelectorAll('.testimonial-slide');

  const updateSlider = () => {
    testimonialTrack.style.transform = `translateX(-${currentTestimonialSlide * 100}%)`;
  };

  prevBtn.addEventListener('click', () => {
    currentTestimonialSlide -= 1;
    if (currentTestimonialSlide < 0) {
      currentTestimonialSlide = slides.length - 1;
    }
    updateSlider();
  });

  nextBtn.addEventListener('click', () => {
    currentTestimonialSlide += 1;
    if (currentTestimonialSlide >= slides.length) {
      currentTestimonialSlide = 0;
    }
    updateSlider();
  });
});
