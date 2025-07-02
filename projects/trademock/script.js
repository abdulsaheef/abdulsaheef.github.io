// Add these to your existing script.js

// Mobile navigation toggle
function toggleMobileNav() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// Navigation between sections
function setupNavigation() {
    // Desktop sidebar nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Also update mobile nav if visible
            updateMobileNavActiveState(section);
        });
    });
    
    // Mobile bottom nav
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update active states
            mobileNavBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateDesktopNavActiveState(section);
        });
    });
    
    // Demat tabs
    const dematTabs = document.querySelectorAll('.demat-tab');
    dematTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            dematTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show correct content
            document.querySelectorAll('.demat-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`demat-${tabName}`).classList.remove('hidden');
        });
    });
}

function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(`${section}-section`).classList.remove('hidden');
    
    // Update section title
    document.getElementById('section-title').textContent = 
        section.charAt(0).toUpperCase() + section.slice(1);
}

function updateMobileNavActiveState(section) {
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    mobileNavBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-section') === section) {
            btn.classList.add('active');
        }
    });
}

function updateDesktopNavActiveState(section) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });
}

// Trade modal functions
function openTradeModal(stockSymbol, stockName, stockPrice, action = 'buy') {
    document.getElementById('trade-stock-symbol').textContent = stockSymbol;
    document.getElementById('trade-stock-name').textContent = stockName;
    document.getElementById('trade-stock-price').textContent = `₹${stockPrice.toFixed(2)}`;
    document.getElementById('trade-price').value = stockPrice.toFixed(2);
    
    // Set trade type
    const tradeTypeBtns = document.querySelectorAll('.trade-type-btn');
    tradeTypeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === action) {
            btn.classList.add('active');
        }
    });
    
    // Update total amount when quantity or price changes
    document.getElementById('trade-qty').addEventListener('input', updateTradeTotal);
    document.getElementById('trade-price').addEventListener('input', updateTradeTotal);
    
    // Show modal
    document.getElementById('trade-modal').classList.add('show');
}

function closeTradeModal() {
    document.getElementById('trade-modal').classList.remove('show');
}

function updateTradeTotal() {
    const qty = parseInt(document.getElementById('trade-qty').value) || 0;
    const price = parseFloat(document.getElementById('trade-price').value) || 0;
    const total = qty * price;
    
    document.getElementById('trade-total').textContent = `₹${total.toFixed(2)}`;
    
    // Calculate brokerage (example: 0.1% or min ₹20)
    const brokerage = Math.max(total * 0.001, 20);
    document.getElementById('trade-brokerage').textContent = `₹${brokerage.toFixed(2)}`;
    
    // Calculate net amount
    const netAmount = total + brokerage;
    document.getElementById('trade-net').textContent = `₹${netAmount.toFixed(2)}`;
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup navigation
    setupNavigation();
    
    // Trade modal close button
    document.querySelector('.modal-close').addEventListener('click', closeTradeModal);
    
    // Trade type buttons
    const tradeTypeBtns = document.querySelectorAll('.trade-type-btn');
    tradeTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tradeTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Trade submit button
    document.getElementById('trade-submit').addEventListener('click', function() {
        // Your existing trade submission logic here
        closeTradeModal();
    });
    
    // Login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        // Your existing login logic here
        
        // For demo, just show the app
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    });
});

// Update your existing stock card generation to use the new HTML structure
function generateStockCard(stock) {
    return `
        <div class="stock-card" data-symbol="${stock.symbol}">
            <div class="stock-header">
                <div>
                    <div class="stock-name">${stock.name}</div>
                    <div class="stock-symbol">${stock.symbol}</div>
                </div>
                <div class="stock-price">₹${stock.price.toFixed(2)}</div>
            </div>
            <div class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">
                ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
            </div>
            <div class="stock-actions">
                <button class="stock-btn buy" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.price}, 'buy')">
                    Buy
                </button>
                <button class="stock-btn sell" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.price}, 'sell')">
                    Sell
                </button>
            </div>
        </div>
    `;
}

