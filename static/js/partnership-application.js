document.addEventListener('DOMContentLoaded', function () {
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.querySelector('.progress-fill');
    const submitBtn = document.querySelector('.submit-btn');
    const form = document.getElementById('solutionPartnerApplicationForm');
    const successMsg = document.getElementById('form-success-message');
    const formNav = document.querySelector('.form-navigation');

    let currentStep = 1;
    const totalSteps = formSteps.length;
    // Track which steps have been validated
    const validatedSteps = new Set();

    updateProgress();

    // ══════════════════════════════════════════
    //  VALIDATION RULES PER FIELD
    // ══════════════════════════════════════════

    const VALIDATORS = {
        // --- Step 1 ---
        firstName: v => {
            v = (v || '').trim();
            if (!v) return 'First name is required.';
            if (v.length < 2 || v.length > 50) return 'First name must be 2-50 characters.';
            if (!/^[A-Za-z\s\-'.]+$/.test(v)) return 'Only letters, spaces, hyphens & apostrophes allowed.';
            return '';
        },
        lastName: v => {
            v = (v || '').trim();
            if (!v) return ''; // Optional field
            if (v.length > 50) return 'Last name must be at most 50 characters.';
            if (!/^[A-Za-z\s\-'.]+$/.test(v)) return 'Only letters, spaces, hyphens & apostrophes allowed.';
            return '';
        },
        email: v => {
            v = (v || '').trim();
            if (!v) return 'Email address is required.';
            if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v)) return 'Please enter a valid email address.';
            return '';
        },
        phone: v => {
            v = (v || '').trim().replace(/[\s\-()]+/g, '');
            if (!v) return 'Phone number is required.';
            if (!/^\d{7,15}$/.test(v)) return 'Phone must be 7-15 digits.';
            return '';
        },
        countryCode: v => {
            if (!v) return 'Country code is required.';
            return '';
        },
        jobTitle: v => {
            if (!v) return 'Please select your role.';
            return '';
        },
        linkedin: v => {
            v = (v || '').trim();
            if (!v) return 'LinkedIn profile URL is required.';
            if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/.test(v)) return 'Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/your-profile).';
            return '';
        },

        // --- Step 2 ---
        company: v => {
            v = (v || '').trim();
            if (!v) return 'Institution/company name is required.';
            if (v.length < 2 || v.length > 100) return 'Must be 2-100 characters.';
            return '';
        },
        website: v => {
            v = (v || '').trim();
            if (v && !/^https?:\/\/.+\..+/.test(v)) return 'Enter a valid URL starting with http:// or https://.';
            return '';
        },
        country: v => {
            if (!v) return 'Please select your country.';
            return '';
        },
        orgType: v => {
            if (!v) return 'Please select organization type.';
            return '';
        },
        studentVolume: v => {
            if (!v) return 'Please select student volume.';
            return '';
        },

        // --- Step 3 ---
        partnershipType: v => {
            if (!v) return 'Please select partnership type.';
            return '';
        },
        expectedTimeline: v => {
            if (!v) return 'Please select expected timeline.';
            return '';
        },

        // --- Step 4 ---
        monthlyVolume: v => {
            v = (v || '').trim();
            if (!v) return 'Expected monthly volume is required.';
            if (v.length < 2 || v.length > 100) return 'Must be 2-100 characters.';
            return '';
        },
        whyPartner: v => {
            v = (v || '').trim();
            if (!v) return 'This field is required.';
            if (v.length < 20) return `Please provide at least 20 characters (currently ${v.length}).`;
            if (v.length > 2000) return 'Please keep your response under 2000 characters.';
            return '';
        },

        // --- Step 5 ---
        additionalInfo: v => {
            v = (v || '').trim();
            if (v && v.length > 2000) return 'Must be under 2000 characters.';
            return '';
        },
    };

    // Map which field names belong to which step
    const STEP_FIELDS = {
        1: ['firstName', 'lastName', 'email', 'phone', 'countryCode', 'jobTitle', 'linkedin'],
        2: ['company', 'website', 'country', 'orgType', 'studentVolume'],
        3: ['partnershipType', 'expectedTimeline'],
        4: ['monthlyVolume', 'whyPartner'],
        5: ['additionalInfo'],
    };

    // ══════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════

    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Phone has a dedicated error span because it shares .form-group with countryCode
        let errorSpan;
        if (fieldId === 'phone') {
            errorSpan = document.getElementById('phone-error');
        } else {
            errorSpan = field.closest('.form-group')?.querySelector('.form-error');
        }

        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.display = message ? 'block' : 'none';
        }
        if (message) {
            field.style.borderColor = '#e13732';
            field.style.animation = 'shake 0.4s';
            setTimeout(() => { field.style.animation = ''; }, 400);
        } else {
            field.style.borderColor = '';
        }
    }

    function clearAllErrors() {
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
            el.style.borderColor = '';
        });
    }

    // ══════════════════════════════════════════
    //  STEP VALIDATION
    // ══════════════════════════════════════════

    function validateStep(stepIndex, silent) {
        const step = document.querySelector(`.form-step[data-step="${stepIndex}"]`);
        if (!step) return true;

        let isValid = true;
        const fieldsToCheck = STEP_FIELDS[stepIndex] || [];

        // Validate normal input/select/textarea fields
        fieldsToCheck.forEach(name => {
            const field = document.getElementById(name);
            if (!field) return;
            const validator = VALIDATORS[name];
            if (!validator) return;

            const error = validator(field.value);
            if (!silent) showFieldError(name, error);
            if (error) isValid = false;
        });

        // Validate radio groups in this step
        if (stepIndex === 2) {
            const radios = step.querySelectorAll('input[name="currentEnglishTraining"]');
            const isChecked = Array.from(radios).some(r => r.checked);
            if (!silent) {
                const container = radios[0]?.closest('.form-group');
                const errorSpan = container?.querySelector('.form-error');
                if (!isChecked) {
                    if (errorSpan) { errorSpan.textContent = 'Please select an option.'; errorSpan.style.display = 'block'; }
                    const wrap = radios[0]?.closest('.checkbox-group') || radios[0]?.closest('div');
                    if (wrap) {
                        wrap.style.border = '1px solid #e13732';
                        wrap.style.padding = '10px';
                        wrap.style.borderRadius = '8px';
                        wrap.style.animation = 'shake 0.4s';
                        setTimeout(() => { wrap.style.animation = ''; }, 400);
                    }
                } else if (errorSpan) {
                    errorSpan.textContent = ''; errorSpan.style.display = 'none';
                    const wrap = radios[0]?.closest('.checkbox-group') || radios[0]?.closest('div');
                    if (wrap) { wrap.style.border = 'none'; wrap.style.padding = '0'; }
                }
            }
            if (!isChecked) isValid = false;
        }

        // Validate checkbox group: targetSegments (step 3)
        if (stepIndex === 3) {
            const checkboxes = step.querySelectorAll('input[name="targetSegments"]');
            const anyChecked = Array.from(checkboxes).some(c => c.checked);
            if (!silent) {
                const container = checkboxes[0]?.closest('.form-group');
                const errorSpan = container?.querySelector('.form-error');
                if (!anyChecked) {
                    if (errorSpan) { errorSpan.textContent = 'Please select at least one target segment.'; errorSpan.style.display = 'block'; }
                    const wrap = checkboxes[0]?.closest('.checkbox-group');
                    if (wrap) {
                        wrap.style.border = '1px solid #e13732';
                        wrap.style.padding = '10px';
                        wrap.style.borderRadius = '8px';
                        wrap.style.animation = 'shake 0.4s';
                        setTimeout(() => { wrap.style.animation = ''; }, 400);
                    }
                } else if (errorSpan) {
                    errorSpan.textContent = ''; errorSpan.style.display = 'none';
                    const wrap = checkboxes[0]?.closest('.checkbox-group');
                    if (wrap) { wrap.style.border = 'none'; wrap.style.padding = '0'; }
                }
            }
            if (!anyChecked) isValid = false;
        }

        // Validate agreement checkboxes (step 5)
        if (stepIndex === 5) {
            ['agreeToTerms', 'authority'].forEach(id => {
                const cb = document.getElementById(id);
                if (!cb) return;
                if (!silent) {
                    const container = cb.closest('.agreement-item');
                    const errorSpan = container?.querySelector('.form-error');
                    if (!cb.checked) {
                        if (errorSpan) {
                            errorSpan.textContent = id === 'agreeToTerms'
                                ? 'You must agree to the terms and conditions.'
                                : 'You must confirm your authority.';
                            errorSpan.style.display = 'block';
                        }
                        const label = cb.closest('label');
                        if (label) {
                            label.style.border = '1px solid #e13732';
                            label.style.padding = '8px';
                            label.style.borderRadius = '8px';
                            label.style.animation = 'shake 0.4s';
                            setTimeout(() => { label.style.animation = ''; }, 400);
                        }
                    } else if (errorSpan) {
                        errorSpan.textContent = ''; errorSpan.style.display = 'none';
                        const label = cb.closest('label');
                        if (label) { label.style.border = 'none'; label.style.padding = ''; }
                    }
                }
                if (!cb.checked) isValid = false;
            });

            // Turnstile check
            if (!silent) {
                const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
                const turnstileError = document.getElementById('turnstile-error');
                if (!turnstileResponse || !turnstileResponse.value) {
                    isValid = false;
                    if (turnstileError) {
                        turnstileError.textContent = 'Please complete the security verification.';
                        turnstileError.style.display = 'block';
                    }
                } else if (turnstileError) {
                    turnstileError.textContent = ''; turnstileError.style.display = 'none';
                }
            }
        }

        // Update validated status and tick marks
        if (isValid) {
            validatedSteps.add(stepIndex);
        } else {
            validatedSteps.delete(stepIndex);
        }
        updateStepTicks();

        return isValid;
    }

    // ══════════════════════════════════════════
    //  STEP TICK MARKS
    // ══════════════════════════════════════════

    function updateStepTicks() {
        progressSteps.forEach((stepEl) => {
            const stepNum = parseInt(stepEl.getAttribute('data-step'));
            const numText = stepEl.querySelector('.step-num-text');
            const tickIcon = stepEl.querySelector('.step-tick');
            if (!numText || !tickIcon) return;

            // Show tick only on validated NON-ACTIVE steps
            // Active step always shows its page number
            if (validatedSteps.has(stepNum) && stepNum !== currentStep) {
                stepEl.classList.add('validated');
                numText.style.display = 'none';
                tickIcon.style.display = 'inline';
            } else {
                stepEl.classList.remove('validated');
                numText.style.display = 'inline';
                tickIcon.style.display = 'none';
            }
        });
    }

    // ══════════════════════════════════════════
    //  COLLECT FORM DATA
    // ══════════════════════════════════════════

    function collectFormData() {
        const data = {};

        // Text / select / textarea
        ['firstName', 'lastName', 'email', 'phone', 'countryCode', 'jobTitle', 'linkedin',
            'company', 'website', 'country', 'orgType', 'studentVolume',
            'partnershipType', 'expectedTimeline',
            'monthlyVolume', 'whyPartner', 'additionalInfo'].forEach(id => {
                const el = document.getElementById(id);
                data[id] = el ? el.value : '';
            });

        data.isWhatsapp = document.getElementById('isWhatsapp')?.checked || false;

        const trainingRadio = document.querySelector('input[name="currentEnglishTraining"]:checked');
        data.currentEnglishTraining = trainingRadio ? trainingRadio.value : '';

        data.targetSegments = Array.from(document.querySelectorAll('input[name="targetSegments"]:checked')).map(c => c.value);

        data.agreeToTerms = document.getElementById('agreeToTerms')?.checked || false;
        data.authority = document.getElementById('authority')?.checked || false;

        const demoRadio = document.querySelector('input[name="demoCall"]:checked');
        data.demoCall = demoRadio ? demoRadio.value : '';

        const turnstileInput = document.querySelector('[name="cf-turnstile-response"]');
        data['cf-turnstile-response'] = turnstileInput ? turnstileInput.value : '';

        return data;
    }

    // ══════════════════════════════════════════
    //  SHOW SERVER ERRORS
    // ══════════════════════════════════════════

    function showServerErrors(errors) {
        if (!errors || typeof errors !== 'object') return;

        Object.entries(errors).forEach(([fieldName, message]) => {
            const field = document.getElementById(fieldName);
            if (field) {
                showFieldError(fieldName, message);
                return;
            }

            if (fieldName === 'currentEnglishTraining' || fieldName === 'targetSegments') {
                const inputs = document.querySelectorAll(`input[name="${fieldName}"]`);
                if (inputs.length) {
                    const container = inputs[0].closest('.form-group');
                    const errorSpan = container?.querySelector('.form-error');
                    if (errorSpan) {
                        errorSpan.textContent = message;
                        errorSpan.style.display = 'block';
                    }
                }
            }

            if (fieldName === 'agreeToTerms' || fieldName === 'authority') {
                const cb = document.getElementById(fieldName);
                if (cb) {
                    const container = cb.closest('.agreement-item');
                    const errorSpan = container?.querySelector('.form-error');
                    if (errorSpan) {
                        errorSpan.textContent = message;
                        errorSpan.style.display = 'block';
                    }
                }
            }
        });

        // Navigate to the step that has the first error
        const errorFieldNames = Object.keys(errors);
        for (let step = 1; step <= totalSteps; step++) {
            const stepFields = STEP_FIELDS[step] || [];
            const hasError = errorFieldNames.some(f => stepFields.includes(f));
            const specialFields = { 2: ['currentEnglishTraining'], 3: ['targetSegments'], 5: ['agreeToTerms', 'authority', 'demoCall'] };
            const hasSpecialError = (specialFields[step] || []).some(f => errorFieldNames.includes(f));

            if (hasError || hasSpecialError) {
                currentStep = step;
                updateFormSteps();
                updateProgress();
                window.scrollTo({ top: document.querySelector('.application-form-container').offsetTop - 100, behavior: 'smooth' });
                break;
            }
        }
    }

    // ══════════════════════════════════════════
    //  NAV BUTTONS
    // ══════════════════════════════════════════

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateFormSteps();
                    updateProgress();
                    window.scrollTo({ top: document.querySelector('.application-form-container').offsetTop - 100, behavior: 'smooth' });
                }
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateFormSteps();
                updateProgress();
                window.scrollTo({ top: document.querySelector('.application-form-container').offsetTop - 100, behavior: 'smooth' });
            }
        });
    });

    // ══════════════════════════════════════════
    //  CLICKABLE STEP CIRCLES (NAVIGATION)
    // ══════════════════════════════════════════

    progressSteps.forEach(stepEl => {
        stepEl.addEventListener('click', () => {
            const targetStep = parseInt(stepEl.getAttribute('data-step'));
            if (targetStep === currentStep) return;

            if (targetStep < currentStep) {
                // Always allow going back
                currentStep = targetStep;
                updateFormSteps();
                updateProgress();
                window.scrollTo({ top: document.querySelector('.application-form-container').offsetTop - 100, behavior: 'smooth' });
            } else {
                // Going forward: validate all steps up to the target
                let canNavigate = true;
                for (let s = currentStep; s < targetStep; s++) {
                    if (!validateStep(s)) {
                        canNavigate = false;
                        // Stay on the failing step
                        currentStep = s;
                        updateFormSteps();
                        updateProgress();
                        window.scrollTo({ top: document.querySelector('.application-form-container').offsetTop - 100, behavior: 'smooth' });
                        break;
                    }
                }
                if (canNavigate) {
                    currentStep = targetStep;
                    updateFormSteps();
                    updateProgress();
                    window.scrollTo({ top: document.querySelector('.application-form-container').offsetTop - 100, behavior: 'smooth' });
                }
            }
        });

        // Keyboard accessibility
        stepEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                stepEl.click();
            }
        });
    });

    // ══════════════════════════════════════════
    //  FORM SUBMISSION
    // ══════════════════════════════════════════

    if (submitBtn) {
        submitBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            if (!validateStep(currentStep)) return;

            submitBtn.querySelector('.btn-text').style.display = 'none';
            submitBtn.querySelector('.btn-loading').style.display = 'inline-flex';
            submitBtn.disabled = true;

            try {
                const formData = collectFormData();

                const response = await fetch('/api/partnership-application', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();

                if (result.success) {
                    formNav.style.display = 'none';
                    formSteps.forEach(step => step.classList.remove('active'));
                    successMsg.style.display = 'block';

                    // Hide progress indicator for clean thank-you page
                    const progressIndicator = document.querySelector('.progress-indicator');
                    if (progressIndicator) progressIndicator.style.display = 'none';

                    // Show reference number
                    if (result.reference_number) {
                        const refEl = document.getElementById('reference-number');
                        if (refEl) refEl.textContent = result.reference_number;
                    }

                    window.scrollTo({ top: document.querySelector('.application-form-container').offsetTop - 100, behavior: 'smooth' });
                } else {
                    clearAllErrors();
                    if (result.errors) {
                        showServerErrors(result.errors);
                    }
                    showToast(result.message || 'Please fix the errors and try again.', 'error');
                }
            } catch (err) {
                console.error('Submission error:', err);
                showToast('Network error — please check your connection and try again.', 'error');
            } finally {
                submitBtn.querySelector('.btn-text').style.display = '';
                submitBtn.querySelector('.btn-loading').style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    // ══════════════════════════════════════════
    //  TOAST
    // ══════════════════════════════════════════

    function showToast(message, type = 'error') {
        const existing = document.getElementById('form-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'form-toast';
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 99999;
            max-width: 420px; padding: 16px 24px;
            background: ${type === 'error' ? '#e13732' : '#0a8769'}; color: #fff;
            border-radius: 12px; font-size: 0.95rem; line-height: 1.5;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // ══════════════════════════════════════════
    //  UI HELPERS
    // ══════════════════════════════════════════

    function updateFormSteps() {
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === currentStep);
        });

        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        const defaultSubmitBtn = document.querySelector('.submit-btn');

        prevBtn.style.display = currentStep === 1 ? 'none' : 'flex';

        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            defaultSubmitBtn.style.display = 'flex';
        } else {
            nextBtn.style.display = 'flex';
            defaultSubmitBtn.style.display = 'none';
        }
    }

    function updateProgress() {
        progressSteps.forEach((step, index) => {
            const stepNum = index + 1;
            if (stepNum < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNum === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressFill.style.width = progressPercent + '%';

        document.querySelectorAll('.step-label').forEach((label, idx) => {
            const originalText = label.textContent.split('(')[0].trim();
            if (idx + 1 === currentStep) {
                const stepPercent = (idx / (totalSteps - 1)) * 100;
                label.textContent = `${originalText} (${Math.round(stepPercent)}%)`;
            } else {
                label.textContent = originalText;
            }
        });

        // Re-apply tick marks
        updateStepTicks();
    }

    // ══════════════════════════════════════════
    //  LIVE VALIDATION (clear errors on input)
    // ══════════════════════════════════════════

    Object.keys(VALIDATORS).forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (!el) return;
        const handler = () => {
            const msg = VALIDATORS[fieldId](el.value);
            if (!msg) showFieldError(fieldId, '');
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    });
});

// ══════════════════════════════════════════
//  COPY-TO-CLIPBOARD HELPERS
// ══════════════════════════════════════════

function copyToClipboard(elementId, btn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent.trim();
    _doCopy(text, btn);
}

function copyText(text, btn) {
    _doCopy(text, btn);
}

function _doCopy(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check" style="margin-right:4px;"></i> Copied!';
        btn.style.borderColor = '#0a8769';
        btn.style.color = '#0a8769';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check" style="margin-right:4px;"></i> Copied!';
        btn.style.borderColor = '#0a8769';
        btn.style.color = '#0a8769';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2000);
    });
}

// ══════════════════════════════════════════
//  KEYFRAMES
// ══════════════════════════════════════════
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    50% { transform: translateX(5px); }
    75% { transform: translateX(-5px); }
    100% { transform: translateX(0); }
}
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
.copy-btn:hover {
    background: #0e415b !important;
    color: white !important;
}
.copy-btn-small:hover {
    background: #f0f0f0 !important;
    border-color: #0e415b !important;
    color: #0e415b !important;
}
`;
document.head.appendChild(style);
