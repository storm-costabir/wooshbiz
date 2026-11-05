/* ==========================================================================
   Quick enquiry form -> public.wooshbiz_leads
   --------------------------------------------------------------------------
   The short form (name, phone, company, team size) in the closing section of
   the home, In-Office and Outdoors pages. Any <form data-enquiry> is wired.
   The full form on contact.html keeps its own script.

   Same contract as contact.html: the anon key below is public by design.
   RLS on wooshbiz_leads allows anon to INSERT only, so this key can write an
   enquiry but never read one back, and the request must ask for
   return=minimal (asking for the row back needs SELECT and fails).

   There is no email field. email is sent as '' so a NOT NULL column, if the
   table has one, is still satisfied; source_page records which page sent it.
   ========================================================================== */
(function () {
    'use strict';

    var SUPABASE_URL = 'https://ytthcgdsbfagvwcopoaj.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGhjZ2RzYmZhZ3Z3Y29wb2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjk5MTMsImV4cCI6MjA5ODkwNTkxM30.JIDahcRTu3VbFpZ55Ti5hHg_JrHobk0zh8PSaj9lWLc';
    var LEADS_REST = SUPABASE_URL + '/rest/v1/wooshbiz_leads';
    var WHATSAPP = 'https://wa.me/919210804078';
    var MAILBOX = 'team@hti-india.com';
    var BUTTON_TEXT = 'Book a free consultation';

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function wire(form) {
        var card = form.closest('.qf') || form;
        var btn = form.querySelector('button[type="submit"]');
        var status = form.querySelector('.qf-status');
        var field = function (name) { return form.querySelector('[name="' + name + '"]'); };

        var RULES = {
            name: function (v) { return v ? '' : 'Please tell us your name.'; },
            phone: function (v) {
                if (!v) return 'A phone number lets us call you back.';
                return v.replace(/\D/g, '').length >= 7 ? '' : 'That phone number looks too short.';
            }
        };

        function showError(name, message) {
            var input = field(name);
            var wrap = input.closest('.qf-field');
            var err = wrap.querySelector('.qf-err');
            wrap.classList.toggle('is-bad', !!message);
            if (message) input.setAttribute('aria-invalid', 'true');
            else input.removeAttribute('aria-invalid');
            err.textContent = message;
            err.hidden = !message;
        }

        function validate() {
            var firstBad = null;
            Object.keys(RULES).forEach(function (name) {
                var message = RULES[name](field(name).value.trim());
                showError(name, message);
                if (message && !firstBad) firstBad = name;
            });
            if (firstBad) field(firstBad).focus();
            return !firstBad;
        }

        Object.keys(RULES).forEach(function (name) {
            var input = field(name);
            input.addEventListener('input', function () {
                if (input.closest('.qf-field').classList.contains('is-bad')) {
                    showError(name, RULES[name](input.value.trim()));
                }
            });
        });

        function pending(on) {
            btn.disabled = on;
            btn.querySelector('span').textContent = on ? 'Sending…' : BUTTON_TEXT;
        }

        function succeed(name) {
            var first = (name || '').trim().split(/\s+/)[0] || 'there';
            card.innerHTML =
                '<div class="qf-done">' +
                    '<div class="qf-tick" aria-hidden="true">&#10003;</div>' +
                    '<h3>Thanks, ' + escapeHtml(first) + ' — that reached us.</h3>' +
                    '<p>Someone from the team will call you within 24 hours, usually sooner.</p>' +
                '</div>';
            // Fired only after the insert succeeds, so a failure is never a lead.
            if (window.wooshTrack) window.wooshTrack('enquiry_submit', { form: 'quick' });
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Honeypot: a human never sees it. Pretend success, send nothing.
            var hp = field('website');
            if (hp && hp.value.trim()) { succeed(field('name').value); return; }

            status.hidden = true;
            if (!validate()) return;

            var name = field('name').value.trim();
            var payload = {
                name: name,
                email: '',
                phone: field('phone').value.trim(),
                source_page: window.location.pathname
            };
            ['company', 'team_size'].forEach(function (column) {
                var input = field(column);
                var value = input ? input.value.trim() : '';
                if (value) payload[column] = value;
            });

            pending(true);
            fetch(LEADS_REST, {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal'
                },
                body: JSON.stringify(payload)
            }).then(function (res) {
                if (!res.ok) throw new Error('Insert failed: ' + res.status);
                succeed(name);
            }).catch(function (err) {
                console.error(err);
                // Never fail silently: an enquiry that vanishes is a lost job.
                status.innerHTML = 'That did not send — something on our end. Please WhatsApp us on ' +
                    '<a href="' + WHATSAPP + '" target="_blank" rel="noopener">+91 92108 04078</a> ' +
                    'or email <a href="mailto:' + MAILBOX + '">' + MAILBOX + '</a>.';
                status.hidden = false;
                pending(false);
            });
        });
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('form[data-enquiry]'), wire);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
