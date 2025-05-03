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

    // Funkcja pomocnicza do animacji "update"
    const triggerUpdateAnimation = (element) => {
        element.classList.remove('updated');
        void element.offsetWidth; // Trigger reflow
        element.classList.add('updated');
        // Usuń klasę po zakończeniu animacji (czas musi pasować do CSS), jeśli animacja sama jej nie usuwa
        // setTimeout(() => { element.classList.remove('updated'); }, 600); // Czas animacji flashUpdate
    };

    // Funkcja do obliczania sumy całkowitej
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
                     triggerUpdateAnimation(subtotalElement);
                }
            }
        });

        currentGrandTotalInCents = calculatedTotalInCents;
        currentFixedRollsTotalInCents = calculatedRollsTotalInCents;

        const newGrandTotalText = formatCurrency(currentGrandTotalInCents / 100);
        if (newGrandTotalText !== previousGrandTotalText) {
             grandTotalElement.textContent = newGrandTotalText;
             triggerUpdateAnimation(grandTotalElement);
        }

        hideWithdrawalResults();
    };

    // Funkcja obliczania wypłaty
    const calculateWithdrawal = () => {
        const targetGrandTotalInCents = 10000;
        calculateTotal(); // Upewnij się, że dane są aktualne

        if (currentGrandTotalInCents <= targetGrandTotalInCents) {
            displayWithdrawalResults("<h3>Informacja</h3><p>Suma całkowita wynosi $100 lub mniej. Nie trzeba nic wyjmować.</p>");
            return;
        }

        if (currentFixedRollsTotalInCents > targetGrandTotalInCents) {
             displayWithdrawalResults(`<h3>Problem</h3><p>Wartość samych rulonów (${formatCurrency(currentFixedRollsTotalInCents / 100)}) przekracza $100. Nie można osiągnąć celu bez otwierania rulonów.</p>`);
             return;
        }

        if (currentFixedRollsTotalInCents === currentGrandTotalInCents && currentGrandTotalInCents > targetGrandTotalInCents) {
              displayWithdrawalResults(`<h3>Problem</h3><p>Masz tylko rulony o wartości ${formatCurrency(currentFixedRollsTotalInCents / 100)}, co jest więcej niż $100. Nie można osiągnąć celu.</p>`);
              return;
         }

        const currentRemovableTotalInCents = currentGrandTotalInCents - currentFixedRollsTotalInCents;
        const targetRemovableValue = targetGrandTotalInCents - currentFixedRollsTotalInCents;

         if (targetRemovableValue < 0) {
             displayWithdrawalResults(`<h3>Problem</h3><p>Wartość samych rulonów (${formatCurrency(currentFixedRollsTotalInCents / 100)}) jest tak duża, że nie da się zejść do $100 usuwając tylko luźne środki.</p>`);
             return;
         }

        let amountToRemoveFromRemovables = currentRemovableTotalInCents - targetRemovableValue;
        amountToRemoveFromRemovables = Math.max(0, Math.round(amountToRemoveFromRemovables));

        if (amountToRemoveFromRemovables <= 0) {
             displayWithdrawalResults("<h3>Informacja</h3><p>Nie trzeba usuwać żadnych luźnych środków, aby pozostało $100 (lub mniej).</p>");
             return;
        }

        const denominationsToRemove = {};
        let remainingAmountToRemove = amountToRemoveFromRemovables;
        let actualRemovedTotalCents = 0;

        denominationsSortedDesc.forEach(denom => {
            if (remainingAmountToRemove <= 0) return;

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
                resultText += `<p>${count} x ${denom.label} (luźne)</p>`;
            }
        });

        if (!itemsFound && amountToRemoveFromRemovables > 0) {
             resultText = `<h3>Problem</h3><p>Nie można dobrać luźnych nominałów, aby dokładnie usunąć ${formatCurrency(amountToRemoveFromRemovables / 100)}. Sprawdź dostępne luźne nominały.</p>`;
        } else if (!itemsFound) {
             resultText = "<h3>Informacja</h3><p>Nie trzeba usuwać żadnych luźnych środków.</p>";
        } else {
             const finalTotal = currentGrandTotalInCents - actualRemovedTotalCents;
             resultText += `<p style="margin-top: 10px; font-weight: bold;">Pozostanie: ${formatCurrency(finalTotal / 100)}</p>`;
             if (currentFixedRollsTotalInCents > 0) {
                 resultText += `<p style="font-size: 0.85em; opacity: 0.9;">(W tym ${formatCurrency(currentFixedRollsTotalInCents / 100)} w nienaruszonych rulonach)</p>`;
             }
             if (Math.abs(finalTotal - targetGrandTotalInCents) > 0) {
                 if (Math.round(actualRemovedTotalCents) !== Math.round(amountToRemoveFromRemovables)) {
                     console.warn("Actual removed amount differs from target removal amount due to rounding/denominations.", { actual: actualRemovedTotalCents, target: amountToRemoveFromRemovables });
                      resultText += `<p style="font-size: 0.8em; opacity: 0.8; margin-top: 5px;">Uwaga: Nie można było dobrać dokładnie ${formatCurrency(amountToRemoveFromRemovables / 100)} z dostępnych luźnych nominałów.</p>`;
                 }
             }
        }

        displayWithdrawalResults(resultText);
    };

    // Funkcja do wyświetlania wyników wypłaty
    const displayWithdrawalResults = (htmlContent) => {
        if (!withdrawalResultsElement) return;
        withdrawalResultsElement.innerHTML = htmlContent;
        withdrawalResultsElement.classList.add('visible');
    };

     // Funkcja do ukrywania wyników wypłaty
     const hideWithdrawalResults = () => {
         if (!withdrawalResultsElement) return;
         withdrawalResultsElement.classList.remove('visible');
     };

    // Tworzenie wierszy dla każdego nominału
    denominations.forEach(denom => {
        const row = document.createElement('div');
        row.classList.add('denomination-row');

        const label = document.createElement('span');
        label.classList.add('denomination-label');
        label.textContent = denom.label;
        row.appendChild(label);

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
        if (!denom.rollInputId) {
            input.classList.add('bill-input');
        }
        inputsContainer.appendChild(input);

        if (denom.rollInputId) {
            const rollInputContainer = document.createElement('span');
            rollInputContainer.classList.add('roll-input-container'); // Dodano klasę dla styli w media query

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
        row.appendChild(inputsContainer);

        const subtotalSpan = document.createElement('span');
        subtotalSpan.classList.add('subtotal');
        subtotalSpan.setAttribute('id', `subtotal-${denom.id}`);
        subtotalSpan.textContent = formatCurrency(0);
        row.appendChild(subtotalSpan);

        denominationsList.appendChild(row);
    });

    // Funkcja resetująca
    const resetCalculator = () => {
        const inputs = denominationsList.querySelectorAll('.quantity-input:not(.roll-input)');
        inputs.forEach(input => { input.value = ''; });
         const rollInputs = denominationsList.querySelectorAll('.roll-input');
         rollInputs.forEach(input => { input.value = '0'; });
        calculateTotal();
        hideWithdrawalResults();
    };

    // Nasłuchiwanie na eventy
    resetButton?.addEventListener('click', resetCalculator);
    calculate100Button?.addEventListener('click', calculateWithdrawal);

    // Oblicz sumę początkową przy załadowaniu strony
    calculateTotal();
});