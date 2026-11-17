import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.POUKAS_SUPABASE_CONFIG;
const authView = document.querySelector('#auth-view');
const appView = document.querySelector('#app-view');
const loginForm = document.querySelector('#login-form');
const loginButton = document.querySelector('#login-button');
const authError = document.querySelector('#auth-error');
const authInfo = document.querySelector('#auth-info');
const signOutButton = document.querySelector('#sign-out-button');
const demoButton = document.querySelector('#demo-button');
const demoBanner = document.querySelector('#demo-banner');
const exitDemoButton = document.querySelector('#exit-demo-button');
const studentsSection = document.querySelector('#students-section');
const dashboardSection = document.querySelector('#dashboard-section');
const studentsTableBody = document.querySelector('#students-table-body');
const studentsFeedback = document.querySelector('#students-feedback');
const studentsTableWrap = document.querySelector('#students-table-wrap');
const studentSearch = document.querySelector('#student-search');
const studentCount = document.querySelector('#student-count');
const studentForm = document.querySelector('#student-form');
const studentFormFeedback = document.querySelector('#student-form-feedback');
const modalitiesSection = document.querySelector('#modalities-section');
const modalitiesList = document.querySelector('#modalities-list');
const demoWhatsappPhone = '5511943596607';
const demoModalities = [
  { id: 'jiu-jitsu', name: 'Jiu-Jitsu', monthlyAmount: 90 },
  { id: 'mma', name: 'MMA', monthlyAmount: 70 }
];
let studentsCache = [];
let currentUser = null;
let supabaseClient = null;
let demoMode = false;
let demoStudentSequence = 4;

const demoStudents = [
  {
    id: 'demo-student-ana', full_name: 'Ana Ribeiro (exemplo)', phone: '+55 11 94359-6607',
    whatsapp: '+55 11 94359-6607', status: 'ativo', modalityIds: ['jiu-jitsu'],
    subscriptions: [{ id: 'demo-subscription-ana', status: 'ativo', invoices: [{
      id: 'demo-invoice-ana', due_date: '2026-11-05', amount_due: 90, status: 'pendente', paid_at: null, payments: []
    }] }]
  },
  {
    id: 'demo-student-bruno', full_name: 'Bruno Martins (exemplo)', phone: '+55 11 94359-6607',
    whatsapp: '+55 11 94359-6607', status: 'ativo', modalityIds: ['mma'],
    subscriptions: [{ id: 'demo-subscription-bruno', status: 'ativo', invoices: [{
      id: 'demo-invoice-bruno', due_date: '2026-10-10', amount_due: 70, status: 'pago', paid_at: '2026-10-10T12:00:00Z', payments: [{ amount: 70, status: 'confirmado' }]
    }] }]
  },
  {
    id: 'demo-student-carla', full_name: 'Carla Souza (exemplo)', phone: '+55 11 94359-6607',
    whatsapp: '+55 11 94359-6607', status: 'ativo', modalityIds: ['jiu-jitsu', 'mma'],
    subscriptions: [{ id: 'demo-subscription-carla', status: 'encerrado', invoices: [{
      id: 'demo-invoice-carla', due_date: '2026-10-25', amount_due: 160, status: 'pendente', paid_at: null, payments: []
    }] }]
  }
];

function showNotice(element, message) {
  element.textContent = message;
  element.hidden = false;
}

function clearNotices() {
  authError.hidden = true;
  authInfo.hidden = true;
  authError.textContent = '';
  authInfo.textContent = '';
}

function isSupabaseConfigured() {
  return Boolean(config?.url && !config.url.includes('SEU-PROJETO') && config?.anonKey && !config.anonKey.includes('SUA_CHAVE'));
}

function showSignedOut(message = '') {
  demoMode = false;
  currentUser = null;
  studentsCache = [];
  demoBanner.hidden = true;
  document.querySelector('#connection-label').textContent = 'CONEXÃO SEGURA';
  document.querySelector('#whatsapp-disclaimer').textContent = 'O WhatsApp abrirá com a mensagem preenchida. Nada será enviado pelo sistema; revise e envie manualmente no WhatsApp.';
  appView.hidden = true;
  authView.hidden = false;
  if (message) showNotice(authInfo, message);
  if (!isSupabaseConfigured()) {
    showNotice(authError, 'Configure a URL e a chave anon pública do Supabase em supabase-config.js para habilitar o acesso.');
  }
}

function showSignedIn(user, profile) {
  demoMode = false;
  demoBanner.hidden = true;
  document.querySelector('#connection-label').textContent = 'CONEXÃO SEGURA';
  setDemoCopy(false);
  authView.hidden = true;
  appView.hidden = false;
  currentUser = user;
  setPage('dashboard');
  const displayName = profile?.full_name?.trim() || user.email || 'Equipe';
  document.querySelector('#user-name').textContent = displayName;
  document.querySelector('#user-role').textContent = profile?.role === 'mestre' ? 'Mestre' : 'Funcionário';
  document.querySelector('#user-avatar').textContent = displayName.charAt(0).toUpperCase();
  document.querySelector('#session-email').textContent = user.email || '';
}

function setDemoCopy(isDemo) {
  document.querySelector('.welcome-kicker').lastChild.textContent = isDemo ? ' MODO LOCAL' : ' PRIMEIRA ETAPA';
  document.querySelector('#welcome-title').textContent = isDemo ? 'Explore a demonstração.' : 'A base está pronta.';
  document.querySelector('.welcome-section > p').textContent = isDemo
    ? 'Esta visualização usa apenas dados fictícios para demonstrar a navegação. Nenhum dado real é acessado ou salvo.'
    : 'A autenticação está ativa. Os dados administrativos aparecerão aqui assim que os módulos forem implantados e conectados ao Supabase.';
  document.querySelector('.welcome-meta span:first-child').textContent = isDemo ? 'AMBIENTE LOCAL' : 'SESSÃO AUTENTICADA';
  document.querySelector('#session-email').textContent = isDemo ? 'DADOS FICTÍCIOS' : (currentUser?.email || '');
}

function startDemo() {
  demoMode = true;
  currentUser = null;
  studentsCache = demoStudents;
  studentSearch.value = '';
  clearNotices();
  loginForm.reset();
  authView.hidden = true;
  appView.hidden = false;
  demoBanner.hidden = false;
  document.querySelector('#connection-label').textContent = 'DEMONSTRAÇÃO LOCAL';
  document.querySelector('#whatsapp-disclaimer').textContent = 'Demonstração: a conversa abre no número de teste +55 11 94359-6607. Revise e envie manualmente no WhatsApp.';
  document.querySelector('#user-name').textContent = 'Visitante';
  document.querySelector('#user-role').textContent = 'Demonstração';
  document.querySelector('#user-avatar').textContent = 'D';
  setDemoCopy(true);
  setPage('dashboard');
}

function setPage(page) {
  const isStudentsPage = page === 'students';
  const isModalitiesPage = page === 'modalities';
  dashboardSection.hidden = page !== 'dashboard';
  studentsSection.hidden = !isStudentsPage;
  modalitiesSection.hidden = !isModalitiesPage;
  document.querySelector('#page-title').textContent = isStudentsPage ? 'Alunos' : isModalitiesPage ? 'Modalidades' : 'Visão geral';
  document.querySelectorAll('.primary-nav [data-page]').forEach((link) => {
    const active = link.dataset.page === page;
    link.classList.toggle('nav-item-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (isStudentsPage) void loadStudents();
  if (isModalitiesPage) renderModalities();
  document.querySelector('#add-student-button').hidden = !demoMode;
}

function normalizePhone(value) {
  const raw = String(value || '').trim();
  const explicitlyInternational = raw.startsWith('+') || raw.startsWith('00');
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('0')) {
    if (digits.length === 11 || digits.length === 12) digits = digits.slice(1);
    else if (digits.length === 13 || digits.length === 14) digits = digits.slice(3);
  }

  const validBrazilianNational = (national) => {
    if (national.length !== 10 && national.length !== 11) return false;
    const areaCode = Number(national.slice(0, 2));
    const subscriber = national.slice(2);
    return areaCode >= 11 && areaCode <= 99
      && (subscriber.length === 9 ? subscriber.startsWith('9') : /^[2-5]/.test(subscriber));
  };

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    const national = digits.slice(2);
    return validBrazilianNational(national) ? digits : null;
  }
  if (digits.length === 10 || digits.length === 11) {
    return validBrazilianNational(digits) ? `55${digits}` : null;
  }
  if (explicitlyInternational && digits.length >= 8 && digits.length <= 15) return digits;
  return null;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

function formatDate(value) {
  if (!value) return 'data não informada';
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
}

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function getStudentInvoices(student) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (student.subscriptions || []).flatMap((subscription) => subscription.invoices || [])
    .filter((invoice) => invoice.status === 'pendente')
    .map((invoice) => ({
      ...invoice,
      amountRemaining: Math.max(0, Number(invoice.amount_due) - (invoice.payments || [])
        .filter((payment) => payment.status === 'confirmado')
        .reduce((sum, payment) => sum + Number(payment.amount), 0)),
      isOverdue: new Date(`${invoice.due_date}T00:00:00`) < today
    }))
    .filter((invoice) => invoice.amountRemaining > 0)
    .sort((left, right) => left.due_date.localeCompare(right.due_date));
}

function getLatestPaidInvoice(student) {
  return (student.subscriptions || []).flatMap((subscription) => subscription.invoices || [])
    .filter((invoice) => invoice.status === 'pago')
    .sort((left, right) => String(right.paid_at || right.due_date).localeCompare(String(left.paid_at || left.due_date)))[0];
}

function getStudentModalityNames(student) {
  if (student.modalityIds) {
    return student.modalityIds.map((id) => demoModalities.find((modality) => modality.id === id)?.name).filter(Boolean);
  }
  return (student.student_modalities || []).map((item) => item.modalities?.name).filter(Boolean);
}

function buildStudentRow(student) {
  const row = document.createElement('tr');
  const pendingInvoices = getStudentInvoices(student);
  const lastPaidInvoice = getLatestPaidInvoice(student);
  const rawPhone = String(student.whatsapp || '').trim() || student.phone;
  const normalizedPhone = demoMode ? demoWhatsappPhone : normalizePhone(rawPhone);

  const nameCell = document.createElement('td');
  nameCell.className = 'student-identity-cell';
  const identityBlock = document.createElement('div');
  identityBlock.className = 'student-identity-copy';
  identityBlock.append(createTextElement('span', 'student-name', student.full_name));
  if (student.whatsapp) identityBlock.append(createTextElement('span', 'student-subtext', 'WhatsApp cadastrado'));
  nameCell.append(identityBlock);
  row.append(nameCell);

  const phoneCell = document.createElement('td');
  phoneCell.append(createTextElement('span', 'student-phone', rawPhone || 'Não cadastrado'));
  row.append(phoneCell);

  const statusCell = document.createElement('td');
  const active = student.status === 'ativo';
  statusCell.append(createTextElement('span', `payment-badge ${active ? 'payment-badge-paid' : 'payment-badge-none'}`, active ? 'Ativo' : 'Inativo'));
  row.append(statusCell);

  const modalityCell = document.createElement('td');
  modalityCell.append(createTextElement('span', 'student-subtext', getStudentModalityNames(student).join(' + ') || 'Não informado'));
  row.append(modalityCell);

  const invoiceCell = document.createElement('td');
  if (pendingInvoices.length) {
    const hasOverdue = pendingInvoices.some((invoice) => invoice.isOverdue);
    invoiceCell.append(createTextElement('span', `payment-badge ${hasOverdue ? 'payment-badge-overdue' : 'payment-badge-pending'}`, hasOverdue ? 'Em atraso' : 'Pendente'));
    const total = pendingInvoices.reduce((sum, invoice) => sum + invoice.amountRemaining, 0);
    invoiceCell.append(createTextElement('span', 'student-subtext', `${pendingInvoices.length > 1 ? `${pendingInvoices.length} mensalidades · ` : ''}${formatCurrency(total)}`));
  } else if (lastPaidInvoice) {
    invoiceCell.append(createTextElement('span', 'payment-badge payment-badge-paid', 'Paga'));
    invoiceCell.append(createTextElement('span', 'student-subtext', `Último pagamento: ${formatDate(String(lastPaidInvoice.paid_at || lastPaidInvoice.due_date).slice(0, 10))}`));
  } else {
    invoiceCell.append(createTextElement('span', 'payment-badge payment-badge-none', 'Sem mensalidade'));
  }
  row.append(invoiceCell);

  const chargeCell = document.createElement('td');
  if (pendingInvoices.length) {
    let invoicePicker = null;
    if (pendingInvoices.length > 1) {
      invoicePicker = document.createElement('select');
      invoicePicker.className = 'invoice-picker';
      invoicePicker.setAttribute('aria-label', `Selecionar mensalidade para ${student.full_name}`);
      pendingInvoices.forEach((invoice) => {
        const option = document.createElement('option');
        option.value = invoice.id;
        option.textContent = `${formatCurrency(invoice.amountRemaining)} · venc. ${formatDate(invoice.due_date)}${invoice.isOverdue ? ' · atraso' : ''}`;
        invoicePicker.append(option);
      });
      chargeCell.append(invoicePicker);
    } else {
      chargeCell.append(createTextElement('span', 'student-subtext', `${formatCurrency(pendingInvoices[0].amountRemaining)} · venc. ${formatDate(pendingInvoices[0].due_date)}`));
    }

    const chargeButton = document.createElement('button');
    chargeButton.type = 'button';
    chargeButton.className = 'charge-action';
    chargeButton.textContent = 'Cobrar pelo WhatsApp';
    chargeButton.disabled = !normalizedPhone;
    if (!normalizedPhone) {
      chargeButton.textContent = 'Telefone inválido';
      chargeButton.title = 'Cadastre um telefone válido com DDD para preparar a cobrança.';
      nameCell.append(chargeButton);
      nameCell.append(createTextElement('span', 'charge-warning', rawPhone ? 'Confira o DDI e o DDD cadastrados.' : 'Cadastre um WhatsApp ou telefone com DDD.'));
    } else {
      const feedback = createTextElement('span', 'charge-feedback', '');
      feedback.hidden = true;
      nameCell.append(chargeButton, feedback);
      chargeButton.addEventListener('click', () => {
        const invoice = pendingInvoices.find((item) => item.id === (invoicePicker?.value || pendingInvoices[0].id));
        if (!invoice) return;
        const paymentSituation = invoice.isOverdue ? 'em atraso' : 'pendente';
        const message = `Olá, ${student.full_name}! Tudo bem? Passando para lembrar que sua mensalidade da Poukas Team Jiu-Jitsu e MMA, no valor de ${formatCurrency(invoice.amountRemaining)}, está ${paymentSituation}. O vencimento é dia ${formatDate(invoice.due_date)}. Qualquer dúvida, estamos à disposição!`;
        const recipient = demoMode ? demoWhatsappPhone : normalizedPhone;
        const whatsappUrl = `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        feedback.textContent = demoMode
          ? 'Conversa de demonstração aberta. Envio manual no WhatsApp.'
          : 'Cobrança preparada para revisão. O envio é manual no WhatsApp.';
        feedback.hidden = false;

        if (!demoMode && supabaseClient && currentUser) {
          void supabaseClient.from('whatsapp_charge_clicks').insert({
            student_id: student.id,
            invoice_id: invoice.id,
            clicked_by: currentUser.id,
            recipient
          }).then(({ error }) => {
            if (error) console.warn('Não foi possível registrar o clique de cobrança.', error.message);
          });
        }
      });
    }
  } else {
    chargeCell.append(createTextElement('span', 'student-subtext', 'Sem cobrança pendente'));
  }
  row.append(chargeCell);
  return row;
}

function renderStudents() {
  const query = studentSearch.value.trim().toLocaleLowerCase('pt-BR');
  const visibleStudents = studentsCache.filter((student) => {
    const searchable = `${student.full_name} ${student.phone || ''} ${student.whatsapp || ''}`.toLocaleLowerCase('pt-BR');
    return searchable.includes(query);
  });

  studentsTableBody.replaceChildren(...visibleStudents.map(buildStudentRow));
  studentCount.textContent = `${visibleStudents.length} ${visibleStudents.length === 1 ? 'aluno' : 'alunos'}`;
  studentsTableWrap.hidden = visibleStudents.length === 0;
  studentsFeedback.hidden = visibleStudents.length > 0;
  if (!visibleStudents.length) {
    studentsFeedback.textContent = studentsCache.length ? 'Nenhum aluno corresponde à busca.' : 'Nenhum aluno cadastrado.';
  }
}

function renderModalities() {
  modalitiesList.replaceChildren(...demoModalities.map((modality) => {
    const item = document.createElement('article');
    item.className = 'modality-row';
    const main = document.createElement('div');
    main.className = 'modality-main';
    main.append(createTextElement('span', 'modality-symbol', modality.id === 'jiu-jitsu' ? 'JJ' : 'MMA'));
    const title = document.createElement('div');
    title.append(createTextElement('h3', '', modality.name));
    title.append(createTextElement('p', '', `${formatCurrency(modality.monthlyAmount)} / mês`));
    main.append(title);

    const students = studentsCache.filter((student) => getStudentModalityNames(student).includes(modality.name));
    const roster = document.createElement('div');
    roster.className = 'modality-roster';
    roster.append(createTextElement('span', 'modality-student-count', `${students.length} ${students.length === 1 ? 'aluno' : 'alunos'}`));
    roster.append(createTextElement('span', 'student-subtext', students.map((student) => student.full_name).join(', ') || 'Nenhum aluno vinculado'));
    item.append(main, roster);
    return item;
  }));
}

function updateStudentPricePreview() {
  const selectedIds = [...studentForm.querySelectorAll('input[name="student_modalities"]:checked')].map((input) => input.value);
  const monthlyAmount = demoModalities
    .filter((modality) => selectedIds.includes(modality.id))
    .reduce((total, modality) => total + modality.monthlyAmount, 0);
  document.querySelector('#student-price-preview').textContent = selectedIds.length
    ? `Mensalidade única: ${formatCurrency(monthlyAmount)} / mês`
    : 'Selecione uma modalidade';
}

function getNextDueDate(dueDay) {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  if (today.getDate() >= dueDay) month += 1;
  const finalDay = new Date(year, month + 1, 0).getDate();
  const dueDate = new Date(year, month, Math.min(dueDay, finalDay));
  return `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
}

function saveDemoStudent(event) {
  event.preventDefault();
  if (!demoMode) return;

  const formData = new FormData(studentForm);
  const fullName = String(formData.get('full_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const dueDay = Number(formData.get('due_day'));
  const modalityIds = formData.getAll('student_modalities').map(String);
  const selectedModalities = demoModalities.filter((modality) => modalityIds.includes(modality.id));
  if (!fullName || !phone || dueDay < 1 || dueDay > 31 || !selectedModalities.length) {
    showNotice(studentFormFeedback, 'Informe nome, telefone, vencimento e pelo menos uma modalidade.');
    return;
  }

  const amountDue = selectedModalities.reduce((total, modality) => total + modality.monthlyAmount, 0);
  const sequence = demoStudentSequence++;
  demoStudents.push({
    id: `demo-student-${sequence}`,
    full_name: `${fullName} (exemplo)`,
    phone,
    whatsapp: phone,
    status: 'ativo',
    modalityIds,
    subscriptions: [{
      id: `demo-subscription-${sequence}`,
      status: 'ativo',
      invoices: [{
        id: `demo-invoice-${sequence}`,
        due_date: getNextDueDate(dueDay),
        amount_due: amountDue,
        status: 'pendente',
        paid_at: null,
        payments: []
      }]
    }]
  });

  studentsCache = demoStudents;
  studentForm.reset();
  studentForm.hidden = true;
  studentSearch.value = '';
  renderStudents();
  renderModalities();
  studentsFeedback.hidden = false;
  studentsFeedback.classList.remove('students-feedback-error');
  studentsFeedback.textContent = `${fullName} adicionado à demonstração. Mensalidade: ${formatCurrency(amountDue)}.`;
}

async function loadStudents() {
  if (demoMode) {
    studentsCache = demoStudents;
    renderStudents();
    return;
  }

  studentsFeedback.classList.remove('students-feedback-error');
  studentsFeedback.textContent = 'Carregando alunos...';
  studentsFeedback.hidden = false;
  studentsTableWrap.hidden = true;
  const { data, error } = await supabaseClient
    .from('students')
    .select('id, full_name, phone, whatsapp, status, student_modalities(modality_id, modalities(name)), subscriptions(id, status, invoices(id, due_date, amount_due, status, paid_at, payments(amount, status)))')
    .order('full_name');

  if (error) {
    studentsFeedback.classList.add('students-feedback-error');
    studentsFeedback.textContent = 'Não foi possível carregar os alunos. Verifique a conexão e as políticas RLS do Supabase.';
    studentCount.textContent = '';
    console.error('Falha ao carregar alunos:', error.message);
    return;
  }

  studentsCache = data || [];
  renderStudents();
}

demoButton.addEventListener('click', startDemo);
exitDemoButton.addEventListener('click', () => {
  studentsCache = [];
  studentSearch.value = '';
  setDemoCopy(false);
  showSignedOut();
});

document.querySelectorAll('.primary-nav [data-page]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setPage(link.dataset.page);
  });
});
document.querySelector('#refresh-students').addEventListener('click', () => void loadStudents());
studentSearch.addEventListener('input', renderStudents);
studentForm.addEventListener('submit', saveDemoStudent);
studentForm.querySelectorAll('input[name="student_modalities"]').forEach((input) => {
  input.addEventListener('change', updateStudentPricePreview);
});
document.querySelector('#add-student-button').addEventListener('click', () => {
  if (!demoMode) return;
  studentForm.reset();
  studentFormFeedback.hidden = true;
  studentForm.hidden = false;
  updateStudentPricePreview();
  document.querySelector('#student-name-input').focus();
});
document.querySelector('#cancel-student-form').addEventListener('click', () => {
  studentForm.reset();
  studentForm.hidden = true;
  studentFormFeedback.hidden = true;
  updateStudentPricePreview();
});
document.querySelector('#cancel-student-form').addEventListener('click', () => {
  studentForm.reset();
  studentForm.hidden = true;
  studentFormFeedback.hidden = true;
  updateStudentPricePreview();
});
studentForm.addEventListener('submit', saveDemoStudent);
studentForm.querySelectorAll('input[name="student_modalities"]').forEach((input) => {
  input.addEventListener('change', updateStudentPricePreview);
});

signOutButton.addEventListener('click', async () => {
  if (demoMode) {
    studentsCache = [];
    studentSearch.value = '';
    setDemoCopy(false);
    showSignedOut();
    return;
  }
  if (!supabaseClient) {
    showSignedOut();
    return;
  }
  signOutButton.disabled = true;
  const { error } = await supabaseClient.auth.signOut();
  signOutButton.disabled = false;
  if (error) {
    showNotice(authError, 'Não foi possível encerrar a sessão. Tente novamente.');
    return;
  }
  loginForm.reset();
  clearNotices();
  showSignedOut();
});

if (!isSupabaseConfigured()) {
  loginButton.disabled = true;
  showNotice(authError, 'Configure a URL e a chave anon pública do Supabase em supabase-config.js para habilitar o acesso.');
} else {
  supabaseClient = createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  async function loadProfile(user) {
    const { data: profile, error } = await supabaseClient
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (error) {
      await supabaseClient.auth.signOut();
      showSignedOut('Não foi possível carregar seu perfil. Confira a migração do banco e tente novamente.');
      return;
    }

    showSignedIn(user, profile);
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotices();
    loginButton.disabled = true;
    loginButton.querySelector('span:first-child').textContent = 'Entrando...';

    const formData = new FormData(loginForm);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: String(formData.get('email')).trim(),
      password: String(formData.get('password'))
    });

    loginButton.disabled = false;
    loginButton.querySelector('span:first-child').textContent = 'Entrar';
    if (error) {
      showNotice(authError, 'Não foi possível entrar. Verifique o e-mail e a senha.');
      return;
    }
    if (data.user) await loadProfile(data.user);
  });

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      studentsCache = [];
      showSignedOut();
    }
  });

  void supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      showSignedOut('Não foi possível restaurar a sessão. Entre novamente.');
      return;
    }
    if (data.session) void loadProfile(data.session.user);
  });
}
