(function () {
  /* Mobile menu */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('site-nav');
  menuBtn.addEventListener('click', function () {
    var open = nav.hidden;
    nav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && window.matchMedia('(max-width: 820px)').matches) {
      nav.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu');
    }
  });

  /* Quote form */
  var form = document.getElementById('quote-form');
  if (!form) return;
  try { var t = new URLSearchParams(location.search).get('type'); if (t === 'interior') document.getElementById('q-type-interior').checked = true; if (t === 'rental') document.getElementById('q-type-rental').checked = true; } catch (e) {}
  var endpoint = (form.getAttribute('data-endpoint') || '').trim();
  var fileInput = document.getElementById('q-photos');
  var drop = document.getElementById('drop');
  var list = document.getElementById('file-list');
  var statusBox = document.getElementById('status');
  var btn = document.getElementById('submit-btn');
  var progress = document.getElementById('progress');
  var bar = document.getElementById('progress-bar');
  var progressText = document.getElementById('progress-text');
  var MAX_FILES = 6, MAX_EACH = 10 * 1024 * 1024, MAX_TOTAL = 25 * 1024 * 1024;
  var files = [];

  function mb(n) { return (n / 1048576).toFixed(1) + ' MB'; }
  function setErr(id, msg, input) {
    document.getElementById(id).textContent = msg || '';
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function renderFiles() {
    list.innerHTML = '';
    files.forEach(function (f, i) {
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.textContent = f.name + ' · ' + mb(f.size);
      var rm = document.createElement('button');
      rm.type = 'button'; rm.textContent = '×'; rm.setAttribute('aria-label', 'Remove ' + f.name);
      rm.addEventListener('click', function () { files.splice(i, 1); renderFiles(); checkFiles(); });
      li.appendChild(name); li.appendChild(rm); list.appendChild(li);
    });
  }
  function checkFiles() {
    var total = files.reduce(function (s, f) { return s + f.size; }, 0);
    var msg = '';
    if (files.length > MAX_FILES) msg = 'Please choose up to ' + MAX_FILES + ' photos.';
    else if (files.some(function (f) { return f.size > MAX_EACH; })) msg = 'Each photo needs to be 10 MB or smaller.';
    else if (total > MAX_TOTAL) msg = 'All photos together need to be 25 MB or smaller. Remove one or two.';
    setErr('q-photos-err', msg);
    return !msg;
  }
  function addFiles(fl) {
    Array.prototype.forEach.call(fl, function (f) {
      if (!/^image\//.test(f.type)) { setErr('q-photos-err', f.name + ' isn’t a photo, so it wasn’t added.'); return; }
      files.push(f);
    });
    renderFiles(); checkFiles();
  }
  fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  function validate() {
    var ok = true, first = null;
    function need(id, errId, msg) {
      var el = document.getElementById(id);
      var bad = !el.value.trim();
      setErr(errId, bad ? msg : '', el);
      if (bad) { ok = false; first = first || el; }
    }
    need('q-name', 'q-name-err', 'Please enter your name.');
    var c = document.getElementById('q-contact');
    var v = c.value.trim();
    var digits = v.replace(/\D/g, '');
    var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    var isPhone = digits.length >= 10 && digits.length <= 11 && !/[a-z@]/i.test(v);
    if (!v) { setErr('q-contact-err', 'Please enter an email or phone number so we can reply.', c); ok = false; first = first || c; }
    else if (!isEmail && !isPhone) { setErr('q-contact-err', 'That doesn’t look like an email or a 10-digit phone number.', c); ok = false; first = first || c; }
    else setErr('q-contact-err', '', c);
    need('q-town', 'q-town-err', 'Please tell us the town or neighbourhood.');
    var type = form.querySelector('input[name="job_type"]:checked');
    setErr('q-type-err', type ? '' : 'Please choose rental turnover or interior painting.');
    if (!type) { ok = false; first = first || document.getElementById('q-type-rental'); }
    need('q-size', 'q-size-err', 'Please tell us the unit size or which rooms.');
    if (!checkFiles()) { ok = false; first = first || fileInput; }
    if (first) first.focus();
    return ok;
  }
  form.addEventListener('input', function (e) {
    var t = e.target;
    if (t.getAttribute('aria-invalid') === 'true' && t.value.trim()) setErr(t.id + '-err', '', t);
    if (t.name === 'job_type') setErr('q-type-err', '');
  });

  function showStatus(kind, title, body) {
    statusBox.className = 'status ' + kind;
    statusBox.innerHTML = '';
    var s = document.createElement('strong'); s.textContent = title;
    var p = document.createElement('p'); p.textContent = body;
    statusBox.appendChild(s); statusBox.appendChild(p);
    if (kind === 'error') {
      var p2 = document.createElement('p'); p2.style.marginTop = '6px';
      var a = document.createElement('a'); a.href = 'https://m.me/61596141884232'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Message us on Facebook instead';
      p2.appendChild(a); statusBox.appendChild(p2);
    }
    statusBox.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusBox.hidden = true;
    if (!validate()) return;
    if (form.querySelector('#q-website').value) return;
    if (!endpoint) {
      showStatus('error', 'Our quote form isn’t connected yet.', 'Your request was not sent. Please send the same details to us on Facebook and we’ll get back to you.');
      if (window.console) console.warn('Cabot Coat quote form: no data-endpoint set on #quote-form. Set it to the form service URL before launch.');
      return;
    }
    var data = new FormData();
    ['name', 'contact', 'town', 'size', 'target_date', 'description'].forEach(function (n) { data.append(n, form.elements[n].value.trim()); });
    data.append('job_type', form.querySelector('input[name="job_type"]:checked').value);
    data.append('_subject', 'New quote request: ' + form.elements.town.value.trim());
    files.forEach(function (f, i) { data.append('attachment' + (i + 1), f, f.name); });

    var xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);
    xhr.setRequestHeader('Accept', 'application/json');
    btn.disabled = true; btn.textContent = 'Sending…';
    progress.hidden = false; progressText.hidden = false; bar.style.width = '0%';
    progressText.textContent = files.length ? 'Uploading photos…' : 'Sending…';
    xhr.upload.onprogress = function (ev) {
      if (ev.lengthComputable) {
        var pct = Math.round(ev.loaded / ev.total * 100);
        bar.style.width = pct + '%';
        progressText.textContent = (files.length ? 'Uploading photos… ' : 'Sending… ') + pct + '%';
      }
    };
    function done() { btn.disabled = false; btn.textContent = 'Send My Quote Request'; progress.hidden = true; progressText.hidden = true; }
    xhr.onload = function () {
      done();
      if (xhr.status >= 200 && xhr.status < 300) {
        form.querySelectorAll('.field, fieldset, .submit-row > .btn').forEach(function (el) { el.hidden = true; });
        showStatus('ok', 'Thanks, your request was sent.', 'We’ll reply to ' + form.elements.contact.value.trim() + ' with a quote or a few questions.');
      } else {
        showStatus('error', 'Your request didn’t go through.', 'Something went wrong on our end (error ' + xhr.status + '). Your details are still here, so please try again in a minute.');
      }
    };
    xhr.onerror = function () {
      done();
      showStatus('error', 'Your request didn’t go through.', 'We couldn’t reach our form service. Check your connection and try again. Your details are still here.');
    };
    xhr.send(data);
  });
})();
