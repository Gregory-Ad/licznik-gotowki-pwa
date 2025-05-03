document.addEventListener('DOMContentLoaded', () => {
    const denominationsList = document.getElementById('denominations-list');
    const grandTotalElement = document.getElementById('grand-total');
    const resetButton = document.getElementById('reset-button');
    const calculate100Button = document.getElementById('calculate-100-button');
    const withdrawalResultsElement = document.getElementById('withdrawal-results');

    // Definicja nominałów + informacje o RULONACH
    const denominations = [
        // Coins with rolls
        { label: '1 Cent', value: 0.01, valueInCents: 1, id: 'penny', rollValueInCents: 50, rollInputId: 'rolls-penny' },
        { label: '5 Centów', value: 0.05, valueInCents: 5, id: 'nickel', rollValueInCents: 200, rollInputId: 'rolls-nickel' },
        { label: '10 Centów', value: 0.10, valueInCents: 10, id: 'dime', rollValueInCents: 500, rollInputId: 'rolls-dime' },
        { label: '25 Centów', value: 0.25, valueInCents: 25, id: 'quarter', rollValueInCents: 1000, rollInputId: 'rolls-quarter' },
        // Bills (no rolls)
        { label: '1 Dolar', value: 1.00, valueInCents: 100, id: 'one-dollar', rollValueInCents: null, rollInputId: null },
        { label: '5 Dolarów', value: 5.00, valueInCents: 500, id: 'five-dollar', rollValueInCents: null, rollInputId: null },
        { label: '10 Dolarów', value: 10.00, valueInCents: 1000, id: 'ten-dollar', rollValueInCents: null, rollInputId: null },
        { label: '20 Dolarów', value: 20.00, valueInCents: 2000, id: 'twenty-dollar', rollValueInCents: null, rollInputId: null },
        { label: '50 Dolarów', value: 50.00, valueInCents: 5000, id: 'fifty-dollar', rollValueInCents: null, rollInputId: null },
        { label: '100 Dolarów', value: 100.00, valueInCents: 10000, id: 'hundred-dollar', rollValueInCents: null, rollInputId: null },
    ];

    // Posortowane nominały od największego do najmniejszego (dla obliczeń wypłaty - tylko dla REMOVABLE items)
    const denominationsSortedDesc = [...denominations].sort((a, b) => b.valueInCents - a.valueInCents);

    const formatCurrency = (amount) => {
        const fixedAmount = parseFloat(amount.toFixed(2));
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fixedAmount);
    }

    let currentGrandTotalInCents = 0;
    let currentFixedRollsTotalInCents = 0; // Nowa zmienna globalna

    // Funkcja do obliczania sumy całkowitej (uwzględnia rulony)
    const calculateTotal = () => {
        let calculatedTotalInCents = 0;
        let calculatedRollsTotalInCents = 0; // Suma tylko z rulonów w tej kalkulacji

        denominations.forEach(denom => {
            const inputElement = document.getElementById(`input-${denom.id}`);
            const subtotalElement = document.getElementById(`subtotal-${denom.id}`);
            let quantity = parseInt(inputElement.value) || 0;
             if (quantity < 0) { inputElement.value = 0; quantity = 0; }

            // Oblicz wartość luźnych monet/banknotów
            const looseSubtotalInCents = quantity * denom.valueInCents;
            let rollSubtotalInCents = 0;

            // Jeśli nominał ma rulony, oblicz ich wartość
            if (denom.rollInputId) {
                const rollInputElement = document.getElementById(denom.rollInputId);
                let rollQuantity = parseInt(rollInputElement.value) || 0;
                 if (rollQuantity < 0) { rollInputElement.value = 0; rollQuantity = 0; }
                rollSubtotalInCents = rollQuantity * denom.rollValueInCents;
                calculatedRollsTotalInCents += rollSubtotalInCents; // Dodaj do sumy rulonów
            }

            // Całkowita wartość dla danego wiersza (luz + rulony)
            const totalRowSubtotalInCents = looseSubtotalInCents + rollSubtotalInCents;
            calculatedTotalInCents += totalRowSubtotalInCents;

            // Wyświetl subtotal dla wiersza
            subtotalElement.textContent = formatCurrency(totalRowSubtotalInCents / 100);
        });

        // Zaktualizuj globalne sumy
        currentGrandTotalInCents = calculatedTotalInCents;
        currentFixedRollsTotalInCents = calculatedRollsTotalInCents; // Aktualizuj sumę rulonów

        // Wyświetl sumę całkowitą
        grandTotalElement.textContent = formatCurrency(currentGrandTotalInCents / 100);

        // Ukryj wyniki poprzedniej kalkulacji wypłaty
        hideWithdrawalResults();
    };

    // ZMODYFIKOWANA Funkcja: Obliczanie wypłaty $100 (ignoruje rulony)
    const calculateWithdrawal = () => {
        const targetGrandTotalInCents = 10000; // $100

        calculateTotal(); // Upewnij się, że sumy (w tym suma rulonów) są aktualne

        // Sprawdź, czy w ogóle trzeba coś robić
        if (currentGrandTotalInCents <= targetGrandTotalInCents) {
            displayWithdrawalResults("<h3>Informacja</h3><p>Suma całkowita wynosi $100 lub mniej. Nie trzeba nic wyjmować.</p>");
            return;
        }

        // Sprawdź, czy sama wartość rulonów nie przekracza $100
        if (currentFixedRollsTotalInCents > targetGrandTotalInCents) {
             displayWithdrawalResults(`<h3>Problem</h3><p>Wartość samych rulonów (${formatCurrency(currentFixedRollsTotalInCents / 100)}) przekracza $100. Nie można osiągnąć celu bez otwierania rulonów.</p>`);
             return;
        }
         // Sprawdź czy po usunięciu WSZYSTKICH luźnych zostanie ponad $100 (czyli czy jest to możliwe)
        if (currentFixedRollsTotalInCents === currentGrandTotalInCents && currentGrandTotalInCents > targetGrandTotalInCents) {
             displayWithdrawalResults(`<h3>Problem</h3><p>Masz tylko rulony o wartości ${formatCurrency(currentFixedRollsTotalInCents / 100)}, co jest więcej niż $100. Nie można osiągnąć celu.</p>`);
             return;
        }

        // Oblicz wartość tylko luźnych monet i banknotów (removable items)
        const currentRemovableTotalInCents = currentGrandTotalInCents - currentFixedRollsTotalInCents;

        // Ile powinna wynosić wartość luźnych monet/banknotów PO operacji?
        const targetRemovableValue = targetGrandTotalInCents - currentFixedRollsTotalInCents;

         // Ile TRZEBA usunąć z luźnych monet/banknotów?
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

        // Algorytm usuwania: Iteruj od największych REMOVABLE nominałów
        denominationsSortedDesc.forEach(denom => {
            if (amountToRemoveFromRemovables <= 0) return;

            const inputElement = document.getElementById(`input-${denom.id}`);
            const currentLooseQuantity = parseInt(inputElement.value) || 0;

            if (currentLooseQuantity > 0 && denom.valueInCents > 0) {
                const maxUnitsNeeded = Math.floor(amountToRemoveFromRemovables / denom.valueInCents);
                const unitsToRemove = Math.min(maxUnitsNeeded, currentLooseQuantity);

                if (unitsToRemove > 0) {
                    denominationsToRemove[denom.id] = unitsToRemove;
                    amountToRemoveFromRemovables -= unitsToRemove * denom.valueInCents;
                    amountToRemoveFromRemovables = Math.round(amountToRemoveFromRemovables);
                }
            }
        });

        // Formatowanie i wyświetlanie wyników
        let resultText = "<h3>Aby zostało $100 (nie ruszając rulonów), wyjmij:</h3>";
        let itemsFound = false;
        let totalRemovedValueCheck = 0;

        denominations.forEach(denom => { // Iteracja rosnąco dla wyświetlania
            if (denominationsToRemove[denom.id] && denominationsToRemove[denom.id] > 0) {
                itemsFound = true;
                const count = denominationsToRemove[denom.id];
                resultText += `<p>${count} x ${denom.label} (luźne)</p>`; // Dodajemy info "luźne"
                totalRemovedValueCheck += count * denom.valueInCents;
            }
        });

        if (!itemsFound && (currentGrandTotalInCents - currentFixedRollsTotalInCents) > targetRemovableValue) {
            console.error("Błąd obliczeń wypłaty: Nie znaleziono luźnych nominałów do usunięcia.", {
                currentGrandTotalInCents, currentFixedRollsTotalInCents, targetGrandTotalInCents, targetRemovableValue, amountToRemoveFromRemovables, denominationsToRemove
            });
             resultText = "<h3>Błąd</h3><p>Wystąpił błąd podczas obliczania wypłaty luźnych środków. Sprawdź konsolę.</p>";
        } else if (!itemsFound) {
             resultText = "<h3>Informacja</h3><p>Nie trzeba usuwać żadnych luźnych środków.</p>";
        }
        else {
            resultText += `<p style="margin-top: 10px; font-weight: bold;">Pozostanie: ${formatCurrency(targetGrandTotalInCents / 100)}</p>`;
            resultText += `<p style="font-size: 0.85em; opacity: 0.9;">(W tym ${formatCurrency(currentFixedRollsTotalInCents / 100)} w nienaruszonych rulonach)</p>`;

            const expectedTotalRemoved = (currentGrandTotalInCents - currentFixedRollsTotalInCents) - targetRemovableValue;
             if (Math.round(totalRemovedValueCheck) !== Math.round(expectedTotalRemoved)) {
                 console.warn("Niezgodność sumy usuniętych nominałów:", { expected: expectedTotalRemoved, actual: totalRemovedValueCheck });
                 resultText += `<p style="font-size: 0.8em; opacity: 0.8;">(Suma kontrolna usuniętych luźnych: ${formatCurrency(totalRemovedValueCheck/100)})</p>`;
             }
        }
        displayWithdrawalResults(resultText);
    };


    // Funkcja do wyświetlania wyników wypłaty
    const displayWithdrawalResults = (htmlContent) => {
        withdrawalResultsElement.innerHTML = htmlContent;
        withdrawalResultsElement.style.display = 'block';
    };

     // Funkcja do ukrywania wyników wypłaty
     const hideWithdrawalResults = () => {
         withdrawalResultsElement.style.display = 'none';
         withdrawalResultsElement.innerHTML = '';
     }; 


    // ZMODYFIKOWANE Tworzenie wierszy dla każdego nominału
    denominations.forEach(denom => {
        const row = document.createElement('div');
        row.classList.add('denomination-row');

        // 1. Etykieta Nominału
        const label = document.createElement('span');
        label.classList.add('denomination-label');
        label.textContent = denom.label;
        row.appendChild(label);

        // 2. Kontener na inputy (luz + rulony)
        const inputsContainer = document.createElement('div');
        inputsContainer.classList.add('inputs-container');

        // 2a. Input dla ilości luźnych
        const input = document.createElement('input');
        input.classList.add('quantity-input'); // Podstawowa klasa
        input.setAttribute('type', 'number');
        input.setAttribute('id', `input-${denom.id}`);
        input.setAttribute('min', '0');
        input.setAttribute('placeholder', 'Sztuki'); // Zmieniono placeholder
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
        input.addEventListener('input', calculateTotal);

        // Dodaj klasę, jeśli to banknot (brak rulonów)
        if (!denom.rollInputId) {
            input.classList.add('bill-input');
        }

        inputsContainer.appendChild(input); // Dodaj input sztuk do kontenera

        // 2b. Input dla ilości rulonów (jeśli dotyczy)
        if (denom.rollInputId) {
            const rollInputContainer = document.createElement('span');
            rollInputContainer.classList.add('roll-input-container');

            const rollLabel = document.createElement('span');
            rollLabel.textContent = 'Rulony:';
            rollLabel.classList.add('roll-label');

            const rollInput = document.createElement('input');
            rollInput.classList.add('roll-input', 'quantity-input'); // Dodajemy też quantity-input dla spójności stylów
            rollInput.setAttribute('type', 'number');
            rollInput.setAttribute('id', denom.rollInputId);
            rollInput.setAttribute('min', '0');
            rollInput.setAttribute('value', '0'); // Domyślnie 0
            rollInput.setAttribute('placeholder', 'Ilość');
            rollInput.setAttribute('inputmode', 'numeric');
            rollInput.setAttribute('pattern', '[0-9]*');
            rollInput.addEventListener('input', calculateTotal);

            rollInputContainer.appendChild(rollLabel);
            rollInputContainer.appendChild(rollInput);
            inputsContainer.appendChild(rollInputContainer); // Dodaj kontener rulonów do kontenera inputów
        }

        row.appendChild(inputsContainer); // Dodaj kontener inputów do wiersza

        // 3. Subtotal (wyświetla sumę luz + rulony dla wiersza)
        const subtotalSpan = document.createElement('span');
        subtotalSpan.classList.add('subtotal');
        subtotalSpan.setAttribute('id', `subtotal-${denom.id}`);
        subtotalSpan.textContent = formatCurrency(0);
        row.appendChild(subtotalSpan);

        denominationsList.appendChild(row);
    });

    // ZMODYFIKOWANA Funkcja resetująca
    const resetCalculator = () => {
        // Resetuj inputy ilości luźnych
        const inputs = denominationsList.querySelectorAll('.quantity-input:not(.roll-input)'); // Wyklucz inputy rulonów na razie
        inputs.forEach(input => {
            input.value = '';
        });
         // Resetuj inputy rulonów do 0
         const rollInputs = denominationsList.querySelectorAll('.roll-input');
         rollInputs.forEach(input => {
             input.value = '0'; // Ustaw na 0, nie na puste
         });

        calculateTotal(); // Przelicz wszystko (powinno dać 0)
        hideWithdrawalResults(); // Ukryj wyniki wypłaty
    };

    // Nasłuchiwanie na eventy
    resetButton.addEventListener('click', resetCalculator);
    calculate100Button.addEventListener('click', calculateWithdrawal);

    // Oblicz sumę początkową
    calculateTotal();
}); // Koniec DOMContentLoaded