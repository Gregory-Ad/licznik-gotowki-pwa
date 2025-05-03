// --- START OF FILE script.js (Quantum Flux - Z Riplem Przycisków) ---

; // Self-invoking function or module pattern could be used here

document.addEventListener('DOMContentLoaded', () => {
    const denominationsList = document.getElementById('denominations-list');
    const grandTotalElement = document.getElementById('grand-total');
    const resetButton = document.getElementById('reset-button');
    const calculate100Button = document.getElementById('calculate-100-button');
    const withdrawalResultsElement = document.getElementById('withdrawal-results');

    const denominations = [
        { label: '1 Cent', value: 0.01, valueInCents: 1, id: 'penny', rollValueInCents: 50, rollInputId: 'rolls-penny' },
        { label: '5 Centów', value: 0.05, valueInCents: 5, id: 'nickel', rollValueInCents: 200, rollInputId: 'rolls-nickel' },
        { label: '10 Centów', value: 0.10, valueInCents: 10, id: 'dime', rollValueInCents: 500, rollInputId: 'rolls-dime' },
        { label: '25 Centów', value: 0.25, valueInCents: 25, id: 'quarter', rollValueInCents: 1000, rollInputId: 'rolls-quarter' },
        { label: '1 Dolar', value: 1.00, valueInCents: 100, id: 'one-dollar', rollValueInCents: null, rollInputId: null },
        { label: '5 Dolarów', value: 5.00, valueInCents: 500, id: 'five-dollar', rollValueInCents: null, rollInputId: null },
        { label: '10 Dolarów', value: 10.00, valueInCents: 1000, id: 'ten-dollar', rollValueInCents: null, rollInputId: null },
        { label: '20 Dolarów', value: 20.00, valueInCents: 2000, id: 'twenty-dollar', rollValueInCents: null, rollInputId: null },
        { label: '50 Dolarów', value: 50.00, valueInCents: 5000, id: 'fifty-dollar', rollValueInCents: null, rollInputId: null },
        { label: '100 Dolarów', value: 100.00, valueInCents: 10000, id: 'hundred-dollar', rollValueInCents: null, rollInputId: null },
    ];
    const denominationsSortedDesc = [...denominations].sort((a, b) => b.valueInCents - a.valueInCents);

    const formatCurrency = (amount) => {
        const fixedAmount = parseFloat(amount.toFixed(2));
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fixedAmount);
    }

    let currentGrandTotalInCents = 0;
    let currentFixedRollsTotalInCents = 0;

    // --- DODANA FUNKCJA TWORZENIA RIPPLE ---
    const createRipple = (event) => {
        const button = event.currentTarget; // Pobierz kliknięty przycisk

        // Usuń istniejące ripple, jeśli są (na wypadek szybkiego klikania)
        // Chociaż animacja powinna sama je usunąć
        const existingRipples = button.querySelectorAll(".ripple");
        existingRipples.forEach(ripple => ripple.remove());

        // Utwórz element span dla ripple
        const ripple = document.createElement("span");
        ripple.classList.add("ripple");

        // Oblicz rozmiar i pozycję ripple
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height); // Rozmiar na podstawie większego wymiaru przycisku
        const x = event.clientX - rect.left - size / 2; // Pozycja X kliknięcia względem przycisku
        const y = event.clientY - rect.top - size / 2;  // Pozycja Y kliknięcia względem przycisku

        // Ustaw style dla ripple
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        // Dodaj ripple do przycisku
        button.appendChild(ripple);

        // Usuń ripple po zakończeniu animacji
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        }, { once: true });
    }
    // --- KONIEC DODANEJ FUNKCJI ---


    // Funkcja pomocnicza do animacji "update" (bez zmian)
    const triggerUpdateAnimation = (element) => {
        element.classList.remove('updated');
        void element.offsetWidth;
        element.classList.add('updated');
        element.addEventListener('animationend', () => {
            element.classList.remove('updated');
        }, { once: true });
    };

    // Funkcja do obliczania sumy całkowitej (bez zmian)
    const calculateTotal = () => {
        let calculatedTotalInCents = 0;
        let calculatedRollsTotalInCents = 0;
        const previousGrandTotalText = grandTotalElement.textContent;
        denominations.forEach(denom => {
            const inputElement = document.getElementById(`input-${denom.id}`);
            const subtotalElement = document.getElementById(`subtotal-${denom.id}`);
            const previousSubtotalText = subtotalElement?.textContent || '';
            let quantity = parseInt(inputElement?.value) || 0;
            if (quantity < 0) { inputElement.value = 0; quantity = 0; }
            const looseSubtotalInCents = quantity * denom.valueInCents;
            let rollSubtotalInCents = 0;
            if (denom.rollInputId) {
                const rollInputElement = document.getElementById(denom.rollInputId);
                let rollQuantity = parseInt(rollInputElement?.value) || 0;
                if (rollQuantity < 0) { rollInputElement.value = 0; rollQuantity = 0; }
                rollSubtotalInCents = rollQuantity * denom.rollValueInCents;
                calculatedRollsTotalInCents += rollSubtotalInCents;
            }
            const totalRowSubtotalInCents = looseSubtotalInCents + rollSubtotalInCents;
            calculatedTotalInCents += totalRowSubtotalInCents;
            if (subtotalElement) {
                const newSubtotalText = formatCurrency(totalRowSubtotalInCents / 100);
                if (newSubtotalText !== previousSubtotalText) {
                    subtotalElement.textContent = newSubtotalText;
                }
            }
        });
        currentGrandTotalInCents = calculatedTotalInCents;
        currentFixedRollsTotalInCents = calculatedRollsTotalInCents;
        const newGrandTotalText = formatCurrency(currentGrandTotalInCents / 100);
        if (newGrandTotalText !== previousGrandTotalText) {
            grandTotalElement.textContent = newGrandTotalText;
        }
        hideWithdrawalResults();
    };

    // Funkcja obliczania wypłaty (bez zmian)
    const calculateWithdrawal = () => {
        const targetGrandTotalInCents = 10000;
        calculateTotal();
        if (currentGrandTotalInCents <= targetGrandTotalInCents) {
            displayWithdrawalResults("<h3>Informacja</h3><p>Suma całkowita wynosi <strong>$100.00</strong> lub mniej. Nie trzeba nic wyjmować.</p>");
            return;
        }
        if (currentFixedRollsTotalInCents > targetGrandTotalInCents) {
            displayWithdrawalResults(`<h3>Problem</h3><p>Wartość samych rulonów (<strong>${formatCurrency(currentFixedRollsTotalInCents / 100)}</strong>) przekracza $100. Nie można osiągnąć celu bez otwierania rulonów.</p>`);
            return;
        }
        if (currentFixedRollsTotalInCents === currentGrandTotalInCents && currentGrandTotalInCents > targetGrandTotalInCents) {
             displayWithdrawalResults(`<h3>Problem</h3><p>Masz tylko rulony o wartości <strong>${formatCurrency(currentFixedRollsTotalInCents / 100)}</strong>, co jest więcej niż $100. Nie można osiągnąć celu.</p>`);
             return;
        }
        const currentRemovableTotalInCents = currentGrandTotalInCents - currentFixedRollsTotalInCents;
        const targetRemovableValue = targetGrandTotalInCents - currentFixedRollsTotalInCents;
        if (targetRemovableValue < 0) {
            displayWithdrawalResults(`<h3>Problem</h3><p>Wartość samych rulonów (<strong>${formatCurrency(currentFixedRollsTotalInCents / 100)}</strong>) jest tak duża, że nie da się zejść do $100 usuwając tylko luźne środki.</p>`);
            return;
        }
        let amountToRemoveFromRemovables = currentRemovableTotalInCents - targetRemovableValue;
        amountToRemoveFromRemovables = Math.max(0, Math.round(amountToRemoveFromRemovables));
        if (amountToRemoveFromRemovables <= 0) {
            displayWithdrawalResults("<h3>Informacja</h3><p>Nie trzeba usuwać żadnych luźnych środków, aby pozostało <strong>$100.00</strong>.</p>");
            return;
        }
        const denominationsToRemove = {};
        let remainingAmountToRemove = amountToRemoveFromRemovables;
        let actualRemovedTotalCents = 0;
        denominationsSortedDesc.forEach(denom => {
            if (remainingAmountToRemove <= 0) return;
            if (denom.rollInputId) return; // Zakładamy, że rulony = monety, a luźne = banknoty? Trzeba by to doprecyzować.
            const inputElement = document.getElementById(`input-${denom.id}`);
            const currentLooseQuantity = parseInt(inputElement?.value) || 0;
            if (currentLooseQuantity > 0 && denom.valueInCents > 0) {
                const maxUnitsPossible = Math.floor(remainingAmountToRemove / denom.valueInCents);
                const unitsToRemove = Math.min(maxUnitsPossible, currentLooseQuantity);
                if (unitsToRemove > 0) {
                    denominationsToRemove[denom.id] = (denominationsToRemove[denom.id] || 0) + unitsToRemove;
                    const removedValue = unitsToRemove * denom.valueInCents;
                    remainingAmountToRemove -= removedValue;
                    actualRemovedTotalCents += removedValue;
                    remainingAmountToRemove = Math.round(remainingAmountToRemove);
                }
            }
        });
        let resultText = `<h3>Aby zostało ~${formatCurrency(targetGrandTotalInCents / 100)} (nie ruszając rulonów), wyjmij:</h3>`;
        let itemsFound = false;
        denominations.forEach(denom => {
            if (denominationsToRemove[denom.id] && denominationsToRemove[denom.id] > 0) {
                itemsFound = true;
                const count = denominationsToRemove[denom.id];
                resultText += `<p><strong>${count}</strong> x ${denom.label} (luźne)</p>`;
            }
        });
        if (!itemsFound && amountToRemoveFromRemovables > 0) {
            resultText = `<h3>Problem</h3><p>Nie można dobrać luźnych nominałów, aby dokładnie usunąć <strong>${formatCurrency(amountToRemoveFromRemovables / 100)}</strong>. Sprawdź dostępne luźne nominały.</p>`;
        } else if (!itemsFound) {
            resultText = "<h3>Informacja</h3><p>Nie trzeba usuwać żadnych luźnych środków.</p>";
        } else {
            const finalTotal = currentGrandTotalInCents - actualRemovedTotalCents;
            resultText += `<p style="margin-top: 10px; font-weight: bold;">Pozostanie: <strong>${formatCurrency(finalTotal / 100)}</strong></p>`;
            if (currentFixedRollsTotalInCents > 0) {
                resultText += `<p style="font-size: 0.85em; opacity: 0.8;">(W tym <strong>${formatCurrency(currentFixedRollsTotalInCents / 100)}</strong> w nienaruszonych rulonach)</p>`;
            }
            if (remainingAmountToRemove > 0) {
                console.warn("Nie można było dobrać dokładnie", { target: amountToRemoveFromRemovables, remaining: remainingAmountToRemove });
                resultText += `<p style="font-size: 0.8em; opacity: 0.7; margin-top: 5px;">Uwaga: Nie można było dobrać dokładnie <strong>${formatCurrency(amountToRemoveFromRemovables / 100)}</strong> z dostępnych luźnych nominałów. Pozostało <strong>${formatCurrency(remainingAmountToRemove / 100)}</strong> nadwyżki.</p>`;
            }
        }
        displayWithdrawalResults(resultText);
    };

    // Funkcja do wyświetlania wyników wypłaty (bez zmian)
    const displayWithdrawalResults = (htmlContent) => {
        if (!withdrawalResultsElement) return;
        withdrawalResultsElement.innerHTML = htmlContent;
        withdrawalResultsElement.classList.add('visible');
    };

     // Funkcja do ukrywania wyników wypłaty (bez zmian)
     const hideWithdrawalResults = () => {
         if (!withdrawalResultsElement) return;
         withdrawalResultsElement.classList.remove('visible');
     };

    // Tworzenie wierszy dla każdego nominału (bez zmian w porównaniu do poprzedniego kroku)
    denominations.forEach(denom => {
        const row = document.createElement('div');
        row.classList.add('denomination-row');
        const label = document.createElement('span');
        label.classList.add('denomination-label');
        label.textContent = denom.label;
        const inputsContainer = document.createElement('div');
        inputsContainer.classList.add('inputs-container');
        const input = document.createElement('input');
        input.classList.add('quantity-input');
        input.setAttribute('type', 'number');
        input.setAttribute('id', `input-${denom.id}`);
        input.setAttribute('min', '0');
        input.setAttribute('placeholder', 'Sztuki');
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
        input.addEventListener('input', calculateTotal);
        inputsContainer.appendChild(input);
        if (denom.rollInputId) {
            const rollInputContainer = document.createElement('span');
            rollInputContainer.classList.add('roll-input-container');
            const rollLabel = document.createElement('span');
            rollLabel.textContent = 'Rulony:';
            rollLabel.classList.add('roll-label');
            const rollInput = document.createElement('input');
            rollInput.classList.add('roll-input', 'quantity-input');
            rollInput.setAttribute('type', 'number');
            rollInput.setAttribute('id', denom.rollInputId);
            rollInput.setAttribute('min', '0');
            rollInput.setAttribute('value', '0');
            rollInput.setAttribute('placeholder', 'Ilość');
            rollInput.setAttribute('inputmode', 'numeric');
            rollInput.setAttribute('pattern', '[0-9]*');
            rollInput.addEventListener('input', calculateTotal);
            rollInputContainer.appendChild(rollLabel);
            rollInputContainer.appendChild(rollInput);
            inputsContainer.appendChild(rollInputContainer);
        }
        const subtotalSpan = document.createElement('span');
        subtotalSpan.classList.add('subtotal');
        subtotalSpan.setAttribute('id', `subtotal-${denom.id}`);
        subtotalSpan.textContent = formatCurrency(0);
        row.appendChild(label);
        row.appendChild(inputsContainer);
        row.appendChild(subtotalSpan);
        const separatorDiv = document.createElement('div');
        separatorDiv.classList.add('row-separator');
        const svgObject = document.createElement('object');
        svgObject.setAttribute('type', 'image/svg+xml');
        svgObject.setAttribute('data', 'separator-animated.svg');
        separatorDiv.appendChild(svgObject);
        row.appendChild(separatorDiv);
        denominationsList.appendChild(row);
    });

    // Funkcja resetująca (bez zmian)
    const resetCalculator = () => {
        const inputs = denominationsList.querySelectorAll('.quantity-input:not(.roll-input)');
        inputs.forEach(input => { input.value = ''; });
        const rollInputs = denominationsList.querySelectorAll('.roll-input');
        rollInputs.forEach(input => { input.value = '0'; });
        calculateTotal();
        hideWithdrawalResults();
    };

    // --- MODYFIKACJA NASŁUCHIWANIA NA EVENTY PRZYCISKÓW ---
    resetButton?.addEventListener('click', (event) => {
        createRipple(event); // <-- Dodaj ripple
        resetCalculator();
    });
    calculate100Button?.addEventListener('click', (event) => {
        createRipple(event); // <-- Dodaj ripple
        calculateWithdrawal();
    });
    // --- KONIEC MODYFIKACJI ---

    // Oblicz sumę początkową przy załadowaniu strony (bez zmian)
    calculateTotal();
});

// --- END OF FILE script.js ---