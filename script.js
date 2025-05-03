
;
document.addEventListener('DOMContentLoaded', () => {
    // ... (stałe na początku bez zmian: denominationsList, grandTotalElement, etc.) ...
    const denominationsList = document.getElementById('denominations-list');
    const grandTotalElement = document.getElementById('grand-total');
    const resetButton = document.getElementById('reset-button');
    const calculate100Button = document.getElementById('calculate-100-button');
    const withdrawalResultsElement = document.getElementById('withdrawal-results');

    // Definicja nominałów + informacje o RULONACH (bez zmian)
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
        element.classList.add('updated');
        // Usuń klasę po zakończeniu animacji (czas musi pasować do CSS)
        setTimeout(() => {
            element.classList.remove('updated');
        }, 400); // 400ms to czas animacji w CSS
    };

    // ZMODYFIKOWANA Funkcja do obliczania sumy całkowitej
    const calculateTotal = () => {
        let calculatedTotalInCents = 0;
        let calculatedRollsTotalInCents = 0;

        const previousGrandTotalText = grandTotalElement.textContent; // Zapamiętaj poprzednią wartość

        denominations.forEach(denom => {
            const inputElement = document.getElementById(`input-${denom.id}`);
            const subtotalElement = document.getElementById(`subtotal-${denom.id}`);
            const previousSubtotalText = subtotalElement.textContent; // Zapamiętaj poprzednią wartość
            let quantity = parseInt(inputElement.value) || 0;
             if (quantity < 0) { inputElement.value = 0; quantity = 0; }

            const looseSubtotalInCents = quantity * denom.valueInCents;
            let rollSubtotalInCents = 0;

            if (denom.rollInputId) {
                const rollInputElement = document.getElementById(denom.rollInputId);
                let rollQuantity = parseInt(rollInputElement.value) || 0;
                 if (rollQuantity < 0) { rollInputElement.value = 0; rollQuantity = 0; }
                rollSubtotalInCents = rollQuantity * denom.rollValueInCents;
                calculatedRollsTotalInCents += rollSubtotalInCents;
            }

            const totalRowSubtotalInCents = looseSubtotalInCents + rollSubtotalInCents;
            calculatedTotalInCents += totalRowSubtotalInCents;

            // Wyświetl subtotal dla wiersza i animuj, jeśli się zmienił
            const newSubtotalText = formatCurrency(totalRowSubtotalInCents / 100);
            if (newSubtotalText !== previousSubtotalText) {
                 subtotalElement.textContent = newSubtotalText;
                 triggerUpdateAnimation(subtotalElement); // Uruchom animację
            }
        });

        currentGrandTotalInCents = calculatedTotalInCents;
        currentFixedRollsTotalInCents = calculatedRollsTotalInCents;

        // Wyświetl sumę całkowitą i animuj, jeśli się zmieniła
        const newGrandTotalText = formatCurrency(currentGrandTotalInCents / 100);
        if (newGrandTotalText !== previousGrandTotalText) {
             grandTotalElement.textContent = newGrandTotalText;
             triggerUpdateAnimation(grandTotalElement); // Uruchom animację
        }

        hideWithdrawalResults(); // Nadal ukrywamy wyniki, jeśli coś się zmieniło
    };

    // Funkcja obliczania wypłaty (USUNIĘTO PUSTĄ DEFINICJĘ TUTAJ)
    // Logika bez zmian, tylko sposób wyświetlania
    const calculateWithdrawal = () => {
        // ... (cała logika obliczeń calculateWithdrawal pozostaje BEZ ZMIAN) ...
        const targetGrandTotalInCents = 10000; // $100 w centach
        calculateTotal(); // Upewnij się, że suma jest aktualna

        // Sprawdzenie, czy suma całkowita nie przekracza celu
        if (currentGrandTotalInCents <= targetGrandTotalInCents) {
            displayWithdrawalResults("<h3>Informacja</h3><p>Suma całkowita wynosi $100 lub mniej. Nie trzeba nic wyjmować.</p>");
            return;
        }

        // Sprawdzenie, czy same rulony nie przekraczają celu
        if (currentFixedRollsTotalInCents > targetGrandTotalInCents) {
             displayWithdrawalResults(`<h3>Problem</h3><p>Wartość samych rulonów (${formatCurrency(currentFixedRollsTotalInCents / 100)}) przekracza $100. Nie można osiągnąć celu bez otwierania rulonów.</p>`);
             return;
        }

        // Sprawdzenie, czy są tylko rulony i przekraczają cel
         if (currentFixedRollsTotalInCents === currentGrandTotalInCents && currentGrandTotalInCents > targetGrandTotalInCents) {
              displayWithdrawalResults(`<h3>Problem</h3><p>Masz tylko rulony o wartości ${formatCurrency(currentFixedRollsTotalInCents / 100)}, co jest więcej niż $100. Nie można osiągnąć celu.</p>`);
              return;
         }

        // Obliczenie, ile trzeba usunąć z luźnych środków
        const currentRemovableTotalInCents = currentGrandTotalInCents - currentFixedRollsTotalInCents;
        const targetRemovableValue = targetGrandTotalInCents - currentFixedRollsTotalInCents; // Ile luźnych środków ma zostać

         // Dodatkowy warunek bezpieczeństwa, chociaż częściowo pokryty przez sprawdzenie samych rulonów
         if (targetRemovableValue < 0) {
              // Ten przypadek teoretycznie nie powinien wystąpić, jeśli `currentFixedRollsTotalInCents <= targetGrandTotalInCents`
              displayWithdrawalResults(`<h3>Problem</h3><p>Wartość samych rulonów (${formatCurrency(currentFixedRollsTotalInCents / 100)}) jest tak duża, że nie da się zejść do $100 usuwając tylko luźne środki.</p>`);
             return;
         }

        let amountToRemoveFromRemovables = currentRemovableTotalInCents - targetRemovableValue;
        amountToRemoveFromRemovables = Math.max(0, Math.round(amountToRemoveFromRemovables)); // Upewnij się, że nie jest ujemna i zaokrąglij

        // Jeśli nie trzeba nic usuwać (np. luźne środki + rulony <= 100$)
        if (amountToRemoveFromRemovables <= 0) {
             // Ten warunek może być bardziej precyzyjny, ale ogólnie działa
             displayWithdrawalResults("<h3>Informacja</h3><p>Nie trzeba usuwać żadnych luźnych środków, aby pozostało $100 (lub mniej, jeśli suma początkowa była niższa).</p>");
             return;
        }


        // Algorytm zachłanny do znalezienia nominałów do usunięcia (tylko z luźnych)
        const denominationsToRemove = {};
        let remainingAmountToRemove = amountToRemoveFromRemovables; // Użyj nowej zmiennej w pętli

        denominationsSortedDesc.forEach(denom => {
            if (remainingAmountToRemove <= 0) return; // Przestań, jeśli już usunęliśmy wystarczająco

            const inputElement = document.getElementById(`input-${denom.id}`);
            const currentLooseQuantity = parseInt(inputElement.value) || 0;

            // Sprawdź tylko luźne nominały (nie rulony) i czy są dostępne
            if (currentLooseQuantity > 0 && denom.valueInCents > 0 && !denom.rollInputId) { // Sprawdzajmy też czy to nie moneta/banknot z rulonem - chociaż inputy są osobne
                const maxUnitsNeeded = Math.floor(remainingAmountToRemove / denom.valueInCents);
                const unitsToRemove = Math.min(maxUnitsNeeded, currentLooseQuantity);

                if (unitsToRemove > 0) {
                    denominationsToRemove[denom.id] = unitsToRemove;
                    remainingAmountToRemove -= unitsToRemove * denom.valueInCents;
                    remainingAmountToRemove = Math.round(remainingAmountToRemove); // Zaokrąglaj po każdej operacji
                }
            } else if (currentLooseQuantity > 0 && denom.valueInCents > 0 && denom.rollInputId){
                 // Obsługa luźnych monet (nie z rolek)
                 const maxUnitsNeeded = Math.floor(remainingAmountToRemove / denom.valueInCents);
                 const unitsToRemove = Math.min(maxUnitsNeeded, currentLooseQuantity); // Używamy `currentLooseQuantity` z inputa sztuk

                 if (unitsToRemove > 0) {
                     denominationsToRemove[denom.id] = unitsToRemove;
                     remainingAmountToRemove -= unitsToRemove * denom.valueInCents;
                     remainingAmountToRemove = Math.round(remainingAmountToRemove);
                 }
            }
        });

        // Przygotowanie tekstu wyniku
        let resultText = `<h3>Aby zostało ${formatCurrency(targetGrandTotalInCents / 100)} (nie ruszając rulonów), wyjmij:</h3>`;
        let itemsFound = false;
        let totalRemovedValueCheck = 0;

        denominations.forEach(denom => { // Iteruj w oryginalnej kolejności dla wyświetlania
            if (denominationsToRemove[denom.id] && denominationsToRemove[denom.id] > 0) {
                itemsFound = true;
                const count = denominationsToRemove[denom.id];
                resultText += `<p>${count} x ${denom.label} (luźne)</p>`;
                totalRemovedValueCheck += count * denom.valueInCents;
            }
        });

        // Obsługa sytuacji, gdy nie znaleziono nic do usunięcia, ale matematycznie powinno się coś usunąć
        // Lub gdy algorytm nie był w stanie dokładnie dobrać kwoty (np. przez zaokrąglenia lub brak odpowiednich nominałów)
        if (!itemsFound && amountToRemoveFromRemovables > 0) {
            // Sprawdźmy, czy po prostu nie ma odpowiednich luźnych nominałów
            if (currentRemovableTotalInCents > targetRemovableValue) {
                 console.warn("Nie można dobrać dokładnie nominałów do usunięcia z dostępnych luźnych środków.", {
                     amountToRemoveTarget: amountToRemoveFromRemovables,
                     currentRemovable: currentRemovableTotalInCents,
                     targetRemovable: targetRemovableValue
                 });
                 // Można dodać bardziej szczegółowy komunikat dla użytkownika
                 resultText = `<h3>Problem</h3><p>Nie udało się dobrać luźnych nominałów, aby dokładnie uzyskać ${formatCurrency(targetGrandTotalInCents / 100)}. Pozostanie najbliższa możliwa kwota powyżej celu, nie ruszając rulonów.</p>`;
             } else {
                 // Ten przypadek teoretycznie nie powinien wystąpić, jeśli amountToRemoveFromRemovables > 0
                 resultText = "<h3>Informacja</h3><p>Nie trzeba usuwać żadnych luźnych środków.</p>";
             }
        } else if (!itemsFound) {
            // Jeśli amountToRemoveFromRemovables było 0 od początku
            resultText = "<h3>Informacja</h3><p>Nie trzeba usuwać żadnych luźnych środków.</p>";
        } else {
             // Jeśli znaleziono nominały do usunięcia
             const remainingTotal = currentGrandTotalInCents - totalRemovedValueCheck;
             resultText += `<p style="margin-top: 10px; font-weight: bold;">Pozostanie: ${formatCurrency(remainingTotal / 100)}</p>`; // Pokaż realną pozostałą kwotę
             if (currentFixedRollsTotalInCents > 0) {
                 resultText += `<p style="font-size: 0.85em; opacity: 0.9;">(W tym ${formatCurrency(currentFixedRollsTotalInCents / 100)} w nienaruszonych rulonach)</p>`;
             }

             // Ostrzeżenie, jeśli obliczona suma do usunięcia różni się od docelowej (np. przez brak nominałów)
             if (Math.round(totalRemovedValueCheck) !== Math.round(amountToRemoveFromRemovables)) {
                 console.warn("Kwota faktycznie usunięta różni się od docelowej kwoty do usunięcia.", {
                     calculatedToRemove: totalRemovedValueCheck,
                     targetToRemove: amountToRemoveFromRemovables
                 });
                  resultText += `<p style="font-size: 0.8em; opacity: 0.8; margin-top: 5px;">Uwaga: Nie można było dobrać dokładnie ${formatCurrency(amountToRemoveFromRemovables / 100)} z dostępnych luźnych nominałów.</p>`;
             }
        }

        // Wyświetl wyniki
        displayWithdrawalResults(resultText);
    };



    // ZMODYFIKOWANA Funkcja do wyświetlania wyników wypłaty (używa klasy)
    const displayWithdrawalResults = (htmlContent) => {
        withdrawalResultsElement.innerHTML = htmlContent; // Najpierw ustaw treść
        withdrawalResultsElement.classList.add('visible'); // Potem dodaj klasę, aby uruchomić animację wejścia
    };

     // ZMODYFIKOWANA Funkcja do ukrywania wyników wypłaty (używa klasy)
     const hideWithdrawalResults = () => {
         withdrawalResultsElement.classList.remove('visible'); // Usuń klasę, aby uruchomić animację wyjścia
         // Opcjonalnie można wyczyścić innerHTML po czasie animacji, ale często nie jest to konieczne
         // setTimeout(() => { if (!withdrawalResultsElement.classList.contains('visible')) withdrawalResultsElement.innerHTML = ''; }, 400); // 400ms pasuje do max-height transition
     };


    // Tworzenie wierszy dla każdego nominału (logika bez zmian od poprzedniej wersji)
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
        input.setAttribute('type', 'number'); input.setAttribute('id', `input-${denom.id}`);
        input.setAttribute('min', '0'); input.setAttribute('placeholder', 'Sztuki');
        input.setAttribute('inputmode', 'numeric'); input.setAttribute('pattern', '[0-9]*');
        input.addEventListener('input', calculateTotal);
        if (!denom.rollInputId) { input.classList.add('bill-input'); }
        inputsContainer.appendChild(input);
        if (denom.rollInputId) {
            const rollInputContainer = document.createElement('span');
            rollInputContainer.classList.add('roll-input-container');
            const rollLabel = document.createElement('span');
            rollLabel.textContent = 'Rulony:'; rollLabel.classList.add('roll-label');
            const rollInput = document.createElement('input');
            rollInput.classList.add('roll-input', 'quantity-input');
            rollInput.setAttribute('type', 'number'); rollInput.setAttribute('id', denom.rollInputId);
            rollInput.setAttribute('min', '0'); rollInput.setAttribute('value', '0');
            rollInput.setAttribute('placeholder', 'Ilość'); rollInput.setAttribute('inputmode', 'numeric');
            rollInput.setAttribute('pattern', '[0-9]*'); rollInput.addEventListener('input', calculateTotal);
            rollInputContainer.appendChild(rollLabel); rollInputContainer.appendChild(rollInput);
            inputsContainer.appendChild(rollInputContainer);
        }
        row.appendChild(inputsContainer);
        const subtotalSpan = document.createElement('span');
        subtotalSpan.classList.add('subtotal'); subtotalSpan.setAttribute('id', `subtotal-${denom.id}`);
        subtotalSpan.textContent = formatCurrency(0);
        row.appendChild(subtotalSpan);
        denominationsList.appendChild(row);
    });

    // Funkcja resetująca (bez zmian od poprzedniej wersji)
    const resetCalculator = () => {
        const inputs = denominationsList.querySelectorAll('.quantity-input:not(.roll-input)');
        inputs.forEach(input => { input.value = ''; });
         const rollInputs = denominationsList.querySelectorAll('.roll-input');
         rollInputs.forEach(input => { input.value = '0'; });
        calculateTotal();
        hideWithdrawalResults();
    };

    // Nasłuchiwanie na eventy (bez zmian)
    resetButton.addEventListener('click', resetCalculator);
    calculate100Button.addEventListener('click', calculateWithdrawal);

    // Oblicz sumę początkową (bez zmian)
    calculateTotal();
}); // Koniec DOMContentLoaded