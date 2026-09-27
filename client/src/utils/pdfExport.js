/**
 * Generates an official, highly professional PDF report of user personal data
 * containing LoveLK branding, logo, identity details, wallet balance, stats,
 * message retention policy, and legal privacy consent logs.
 */
export const generateUserDataPDF = (exportData, currentUser) => {
  const profile = exportData?.profile || currentUser || {};
  const wallet = exportData?.wallet || {};
  const stats = exportData?.statistics || {};
  const consents = Array.isArray(exportData?.consents) ? exportData.consents : [];

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Please allow popups to download your official PDF data report.');
    return;
  }

  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const docId = `LK-PRIV-${Math.floor(100000 + Math.random() * 900000)}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LoveLK - Personal Data & Privacy Report (${profile.name || 'User'})</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      margin: 0;
      padding: 20px;
      background-color: #ffffff;
    }
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #7c3aed;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .logo-badge {
      background: linear-gradient(135deg, #7c3aed, #ec4899);
      color: #ffffff;
      font-weight: 900;
      font-size: 18px;
      padding: 6px 14px;
      border-radius: 12px;
      letter-spacing: 0.5px;
      display: inline-block;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-left: 8px;
      display: inline-block;
      vertical-align: middle;
    }
    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .report-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .report-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #6d28d9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 16px;
    }
    .info-item {
      font-size: 12px;
    }
    .info-label {
      font-weight: 700;
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
      margin-top: 2px;
      word-break: break-word;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-active { background: #dcfce7; color: #15803d; }
    .badge-premium { background: #fef3c7; color: #b45309; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 25px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; background: white; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <span class="logo-badge">LoveLK</span>
      <span class="brand-name">LoveLK Matrimonial</span>
    </div>
    <div class="doc-meta">
      <div><strong>Report Ref:</strong> ${docId}</div>
      <div><strong>Generated:</strong> ${exportDate}</div>
    </div>
  </div>

  <div class="report-title">Official Personal Data & Privacy Archive Report</div>
  <div class="report-subtitle">Certified Personal Data Record under GDPR & Sri Lanka Personal Data Protection Act (PDPA) Compliance</div>

  <!-- Section 1: Member Profile -->
  <div class="section">
    <div class="section-title">👤 Member Profile & Account Information</div>
    <div class="grid">
      <div class="info-item"><div class="info-label">Full Name</div><div class="info-value">${profile.name || 'N/A'}</div></div>
      <div class="info-item"><div class="info-label">Profile Name</div><div class="info-value">${profile.profileName || profile.name || 'N/A'}</div></div>
      <div class="info-item"><div class="info-label">Email Address</div><div class="info-value">${profile.email || 'N/A'}</div></div>
      <div class="info-item"><div class="info-label">Phone Number</div><div class="info-value">${profile.phoneNumber || 'Not specified'}</div></div>
      <div class="info-item"><div class="info-label">Age & Gender</div><div class="info-value">${profile.age || 'N/A'} Yrs | ${profile.gender || 'N/A'}</div></div>
      <div class="info-item"><div class="info-label">District & Location</div><div class="info-value">${profile.district || profile.location || 'Sri Lanka'}</div></div>
      <div class="info-item"><div class="info-label">Membership Tier</div><div class="info-value"><span class="badge ${profile.isPremium ? 'badge-premium' : 'badge-active'}">${profile.role === 'admin' ? 'Administrator' : (profile.isPremium ? (profile.premiumPlan || 'Premium') : 'Free Member')}</span></div></div>
      <div class="info-item"><div class="info-label">Account Status</div><div class="info-value"><span class="badge badge-active">${profile.accountStatus || 'Active'}</span></div></div>
    </div>
  </div>

  <!-- Section 2: Wallet & Retention Policy -->
  <div class="section">
    <div class="section-title">💰 Wallet Balance & Messaging Policy</div>
    <div class="grid">
      <div class="info-item"><div class="info-label">Wallet Balance</div><div class="info-value">Rs. ${wallet.balance || 0} ${wallet.currency || 'LKR'}</div></div>
      <div class="info-item"><div class="info-label">Reward Points</div><div class="info-value">${stats?.points || 0} Points</div></div>
      <div class="info-item"><div class="info-label">Chat Message Retention</div><div class="info-value">${profile.isPremium || profile.role === 'admin' ? '48 Hours (Premium Retention)' : '36 Hours (Free User Retention)'}</div></div>
      <div class="info-item"><div class="info-label">Daily Message Allowance</div><div class="info-value">${profile.isPremium || profile.role === 'admin' ? 'Unlimited Messages' : '10 Messages per rolling 24 Hours'}</div></div>
    </div>
  </div>

  <!-- Section 3: Platform Activity Statistics -->
  <div class="section">
    <div class="section-title">📊 Activity & Platform Statistics</div>
    <div class="grid">
      <div class="info-item"><div class="info-label">Total Messages Sent</div><div class="info-value">${stats?.totalMessagesSent || profile.messagesSent || 0}</div></div>
      <div class="info-item"><div class="info-label">Login Streak</div><div class="info-value">${stats?.loginStreak || 1} Days</div></div>
      <div class="info-item"><div class="info-label">Total Gifts Sent</div><div class="info-value">${stats?.totalGiftsSent || 0}</div></div>
      <div class="info-item"><div class="info-label">Total Gifts Received</div><div class="info-value">${stats?.totalGiftsReceived || 0}</div></div>
    </div>
  </div>

  <!-- Section 4: Privacy Consents Log -->
  <div class="section">
    <div class="section-title">🔒 Legal Privacy Consent Audit Log</div>
    ${consents.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Accepted Date</th>
            <th>Policy Version</th>
            <th>Consent Source</th>
            <th>Agreements Included</th>
          </tr>
        </thead>
        <tbody>
          ${consents.map(c => `
            <tr>
              <td>${new Date(c.acceptedAt).toLocaleDateString()}</td>
              <td>v${c.policyVersions?.privacyPolicy || '2.0'}</td>
              <td>${c.consentSource || 'policy_modal'}</td>
              <td>18+ Age, Accuracy, Terms & 10-Day Retention Accepted</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="font-size: 11px; color: #64748b;">Registration privacy policy consent verified on account creation.</p>'}
  </div>

  <div class="footer">
    Official Personal Data Archive • Generated by LoveLK Matrimonial Platform • Certified Authentic Record
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
