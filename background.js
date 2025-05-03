// --- START OF FILE background.js ---

// Czekaj na załadowanie DOM, aby mieć pewność, że canvas istnieje
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('webgl-background');
    if (!canvas) {
        console.error("Nie znaleziono elementu canvas #webgl-background");
        return;
    }

    // Spróbuj uzyskać kontekst WebGL
    // Używamy 'webgl', ponieważ jest szerzej wspierany niż 'webgl2' na starszych urządzeniach
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false }); // alpha:false dla lepszej wydajności, jeśli nie potrzebujemy przezroczystości canvasa

    if (!gl) {
        console.error("WebGL nie jest wspierany lub jest wyłączony.");
        // Można tu dodać fallback do prostego tła CSS lub ukryć canvas
        canvas.style.display = 'none';
        return;
    }

    // --- Definicje Shaderów ---

    // Vertex Shader: Pozycjonuje wierzchołki i przekazuje współrzędne UV
    const vsSource = `
        attribute vec2 a_position; // Pozycja wierzchołka (-1 do 1)
        varying vec2 v_uv;         // Współrzędne UV (0 do 1) przekazywane do fragment shadera

        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0); // Ustaw pozycję
            v_uv = a_position * 0.5 + 0.5; // Przelicz na zakres 0-1
        }
    `;

    // Fragment Shader: Oblicza kolor każdego piksela (Tu dzieje się "magia")
    const fsSource = `
        precision highp float; // Wyższa precyzja dla płynniejszych gradientów/noise'u

        varying vec2 v_uv;              // Współrzędne UV z vertex shadera
        uniform vec2 u_resolution;      // Rozdzielczość canvasa (szerokość, wysokość)
        uniform float u_time;           // Czas od uruchomienia (do animacji)

        // Prosta funkcja hashująca do generowania pseudo-losowości
        float random (vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        // Funkcja szumu (Value Noise) - prostsza niż Perlin/Simplex
        float noise (vec2 st) {
            vec2 i = floor(st); // Część całkowita
            vec2 f = fract(st); // Część ułamkowa

            // Interpolacja czterech sąsiednich punktów siatki
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));

            // Wygładzona interpolacja (smoothstep)
            vec2 u = f * f * (3.0 - 2.0 * f);
            // Interpolacja w poziomie, potem w pionie
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        // FBM (Fractal Brownian Motion) - warstwowanie szumu dla większej złożoności
        #define OCTAVES 4 // Liczba warstw szumu (więcej = bardziej złożone, ale wolniejsze)
        float fbm (vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 0.0; // Zaczynamy od 0, aby użyć podstawowej skali poniżej
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5)); // Macierz rotacji dla urozmaicenia

            for (int i = 0; i < OCTAVES; i++) {
                value += amplitude * noise(st);
                st = rot * st * 2.0; // Zwiększ częstotliwość i obróć
                amplitude *= 0.5; // Zmniejsz amplitudę
            }
            return value;
        }


        void main() {
            vec2 uv = v_uv; // Używamy przekazanych UV
            // Możemy lekko zniekształcić UV na podstawie rozdzielczości, aby uniknąć rozciągania
            // uv.x *= u_resolution.x / u_resolution.y;

            // Parametry animacji i wyglądu
            float time = u_time * 0.08; // Spowolnienie czasu
            float noiseScale = 3.0;   // Skala szumu (mniejsza wartość = większe struktury)
            float flowSpeedX = 0.2;   // Prędkość przepływu w poziomie
            float flowSpeedY = 0.1;   // Prędkość przepływu w pionie

            // Tworzenie dwóch warstw FBM dla bardziej złożonego przepływu
            vec2 motion1 = vec2(time * flowSpeedX, time * flowSpeedY);
            vec2 motion2 = vec2(time * -flowSpeedY, time * flowSpeedX * 0.5); // Inny kierunek i prędkość

            float n1 = fbm(uv * noiseScale + motion1);
            float n2 = fbm(uv * (noiseScale * 0.8) + motion2 + 0.5); // Lekko inna skala i przesunięcie

            // Połączenie warstw - można eksperymentować (np. mix, mnożenie)
            float combinedNoise = (n1 + n2) * 0.5;

            // Mapowanie wartości szumu (0-1) na gradient kolorów Quantum Flux
            // Kolory zdefiniowane jako vec3(R, G, B) w zakresie 0.0-1.0
            vec3 colorDark = vec3(0.008, 0.02, 0.063); // ~ --qf-bg-dark
            vec3 colorMid = vec3(0.039, 0.059, 0.125); // ~ --qf-bg-mid
            vec3 colorEnergy = vec3(0.314, 0.816, 1.0); // ~ --qf-energy-primary (błękit)
            // Można dodać --qf-energy-secondary jako rzadki akcent

            // Tworzenie gradientu: Ciemny -> Średni -> Jasny Błękit
            vec3 color = mix(colorDark, colorMid, smoothstep(0.2, 0.5, combinedNoise));
            color = mix(color, colorEnergy, smoothstep(0.55, 0.7, combinedNoise)); // Jaśniejsze pasma

             // Dodanie lekkiego "migotania" do najjaśniejszych części
             float flicker = sin(u_time * 2.0 + combinedNoise * 10.0) * 0.05 + 0.95;
             if (combinedNoise > 0.65) {
                 color *= flicker;
             }

            // Ostateczny kolor piksela (z kanałem alfa = 1.0 - nieprzezroczysty)
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // --- Funkcje pomocnicze WebGL ---

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.error(`Błąd kompilacji shadera (${type === gl.VERTEX_SHADER ? "Vertex" : "Fragment"}):`, gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }
        console.error("Błąd linkowania programu WebGL:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    // --- Inicjalizacja WebGL ---

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    if (!program) return; // Zakończ, jeśli wystąpił błąd

    // Lokalizacje atrybutów i uniformów
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");

    // Bufor dla wierzchołków prostokąta (quad)
    const positionBuffer = gl.createBuffer();
    // Używamy TRIANGLES, więc potrzebujemy 6 wierzchołków (dwa trójkąty)
    const positions = [
        -1, -1, // lewy dolny
         1, -1, // prawy dolny
        -1,  1, // lewy górny
        -1,  1, // lewy górny (ponownie)
         1, -1, // prawy dolny (ponownie)
         1,  1, // prawy górny
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // --- Dopasowanie rozmiaru Canvasa i pętla renderowania ---
    let startTime = performance.now();

    function resizeCanvasToDisplaySize(canvas) {
        const displayWidth  = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        // Sprawdź, czy rozmiar canvasa różni się od rozmiaru wyświetlania
        if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
            canvas.width  = displayWidth;
            canvas.height = displayHeight;
            return true; // Rozmiar się zmienił
        }
        return false; // Rozmiar pozostał taki sam
    }

    function render(time) {
        time *= 0.001; // konwersja czasu na sekundy
        const elapsedTime = performance.now() - startTime; // lub po prostu time

        // Dopasuj rozmiar canvasa do rozmiaru okna (ważne dla responsywności)
        if (resizeCanvasToDisplaySize(gl.canvas)) {
            // Ustaw viewport WebGL, jeśli rozmiar się zmienił
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        // Czyszczenie canvasa (niekonieczne, jeśli shader zawsze rysuje na każdym pikselu)
        // gl.clearColor(0, 0, 0, 0);
        // gl.clear(gl.COLOR_BUFFER_BIT);

        // Użyj programu WebGL
        gl.useProgram(program);

        // Włącz atrybut pozycji
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Powiedz atrybutowi, jak pobierać dane z bufora (positionBuffer)
        const size = 2;          // 2 komponenty na iterację (x, y)
        const type = gl.FLOAT;   // dane to 32bitowe floaty
        const normalize = false; // nie normalizuj danych
        const stride = 0;        // 0 = przechodź size * sizeof(type) bajtów do następnej pozycji
        const offset = 0;        // zacznij od początku bufora
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

        // Ustaw uniformy (rozdzielczość i czas)
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(timeUniformLocation, elapsedTime / 1000.0); // czas w sekundach

        // Narysuj prostokąt (2 trójkąty = 6 wierzchołków)
        const primitiveType = gl.TRIANGLES;
        const drawOffset = 0;
        const count = 6;
        gl.drawArrays(primitiveType, drawOffset, count);

        // Poproś o następną klatkę animacji
        requestAnimationFrame(render);
    }

    // Rozpocznij pętlę renderowania
    requestAnimationFrame(render);

    // Dodaj nasłuchiwanie na zmianę rozmiaru okna, aby zaktualizować canvas
    window.addEventListener('resize', () => {
        // Funkcja render sama sprawdzi i dostosuje rozmiar w następnej klatce
        // Można by tu wymusić resize od razu, ale nie jest to krytyczne
    });

});

// --- END OF FILE background.js ---