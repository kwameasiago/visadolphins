(function () {
    // Swimming Classes form
    var swimmingForm = document.getElementById('apply-swimming-form');
    if (swimmingForm) {
        swimmingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitApplication(swimmingForm, {
                form_type: 'swimming',
                name: document.getElementById('af-name').value.trim(),
                phone: document.getElementById('af-phone').value.trim(),
                email: document.getElementById('af-email').value.trim(),
                level: document.getElementById('af-level').value
            });
        });
    }

    // Corporate / School form
    var corporateForm = document.getElementById('apply-corporate-form');
    if (corporateForm) {
        corporateForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitApplication(corporateForm, {
                form_type: 'corporate',
                name: document.getElementById('cf-contact').value.trim(),
                phone: document.getElementById('cf-phone').value.trim(),
                email: document.getElementById('cf-email').value.trim(),
                school_name: document.getElementById('cf-school').value.trim(),
                num_students: parseInt(document.getElementById('cf-students').value) || 0
            });
        });
    }

    async function submitApplication(form, payload) {
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Remove old message
        var oldMsg = form.parentNode.querySelector('.contact-form-message');
        if (oldMsg) oldMsg.remove();

        try {
            var res = await fetch(APP_CONFIG.API_BASE_URL + '/applications.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            var data = await res.json();
            var msgEl = document.createElement('div');
            msgEl.className = 'contact-form-message';

            if (res.ok) {
                msgEl.className += ' contact-form-message--success';
                msgEl.textContent = data.message || 'Application submitted!';
                form.reset();
            } else {
                msgEl.className += ' contact-form-message--error';
                msgEl.textContent = data.error || 'Something went wrong. Please try again.';
            }
            form.parentNode.insertBefore(msgEl, form.nextSibling);
        } catch (err) {
            var errEl = document.createElement('div');
            errEl.className = 'contact-form-message contact-form-message--error';
            errEl.textContent = 'Network error. Please try again.';
            form.parentNode.insertBefore(errEl, form.nextSibling);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
})();
