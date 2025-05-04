// --- START OF FILE background.js (3D Noise / Volumetric Simulation Version) ---

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('webgl-background');
    if (!canvas) {
        console.error("Nie znaleziono elementu canvas #webgl-background");
        return;
    }

    // --- Konfiguracja Efektu ---
    const NOISE_SCALE = 2.5;     // Skala szumu (mniejsza wartość = większe struktury)
    const TIME_SPEED = 0.05;     // Prędkość "przechodzenia" przez szum w osi Z (czas)
    const FLOW_SPEED_X = 0.0;    // Dodatkowa prędkość przepływu w X (0 = brak)
    const FLOW_SPEED_Y = 0.0;    // Dodatkowa prędkość przepływu w Y (0 = brak)
    const OCTAVES = 4;           // Liczba warstw szumu FBM (więcej = detale, ale wolniej)

    let gl;
    let program;
    let positionBuffer;
    let positionAttributeLocation;
    let resolutionUniformLocation;
    let timeUniformLocation;
    let startTime = performance.now();

    // Spróbuj uzyskać kontekst WebGL
    gl = canvas.getContext('webgl', { alpha: false, antialias: false });

    if (!gl) {
        console.error("WebGL nie jest wspierany lub jest wyłączony.");
        canvas.style.display = 'none';
        return;
    }

    // --- Definicje Shaderów ---

    // Vertex Shader: Pozycjonuje wierzchołki i przekazuje współrzędne UV (jak w oryginale)
    const vsSource = `
        attribute vec2 a_position; // Pozycja wierzchołka (-1 do 1)
        varying vec2 v_uv;         // Współrzędne UV (0 do 1) przekazywane do fragment shadera

        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0); // Ustaw pozycję
            // Przelicz na zakres 0-1 dla UV, odwracając Y (częsty problem z orientacją tekstur/UV)
            v_uv = a_position * 0.5 + 0.5;
             // v_uv.y = 1.0 - v_uv.y; // Odkomentuj, jeśli orientacja Y jest nieprawidłowa
        }
    `;

    // Fragment Shader: Oblicza kolor na podstawie szumu 3D
    const fsSource = `
        precision highp float; // Wyższa precyzja

        varying vec2 v_uv;              // Współrzędne UV z vertex shadera
        uniform vec2 u_resolution;      // Rozdzielczość canvasa
        uniform float u_time;           // Czas od uruchomienia

        // --- Implementacja Szumu 3D ---
        // Prosta funkcja hashująca 3D -> 1D (pseudo-losowość)
        float random (vec3 st) {
             // Mieszanie komponentów i użycie funkcji trygonometrycznej
             // Stałe dobrane eksperymentalnie dla dobrych wyników wizualnych
            return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.321))) * 43758.5453123);
        }

        // Funkcja szumu 3D (Value Noise)
        float noise3D (vec3 st) {
            vec3 i = floor(st); // Część całkowita
            vec3 f = fract(st); // Część ułamkowa

            // Interpolacja 8 sąsiednich punktów siatki w 3D
            float v000 = random(i + vec3(0.0, 0.0, 0.0));
            float v100 = random(i + vec3(1.0, 0.0, 0.0));
            float v010 = random(i + vec3(0.0, 1.0, 0.0));
            float v110 = random(i + vec3(1.0, 1.0, 0.0));
            float v001 = random(i + vec3(0.0, 0.0, 1.0));
            float v101 = random(i + vec3(1.0, 0.0, 1.0));
            float v011 = random(i + vec3(0.0, 1.0, 1.0));
            float v111 = random(i + vec3(1.0, 1.0, 1.0));

            // Wygładzona interpolacja (smoothstep)
            vec3 u = f * f * (3.0 - 2.0 * f);

            // Interpolacja trójliniowa
            return mix( mix( mix(v000, v100, u.x),
                           mix(v010, v110, u.x), u.y),
                        mix( mix(v001, v101, u.x),
                           mix(v011, v111, u.x), u.y), u.z);
        }

        // FBM 3D (Fractal Brownian Motion)
        #define OCTAVES ${OCTAVES} // Użycie stałej z JS (wymaga ponownej kompilacji przy zmianie)
        float fbm3D (vec3 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0; // Zaczynamy od bazowej częstotliwości

            for (int i = 0; i < OCTAVES; i++) {
                value += amplitude * noise3D(st * frequency);
                frequency *= 2.0;  // Podwój częstotliwość dla następnej oktawy
                amplitude *= 0.5;  // Zmniejsz amplitudę
            }
            return value;
        }
        // --- Koniec Implementacji Szumu 3D ---


        void main() {
            // Używamy v_uv, dostosowujemy proporcje, aby uniknąć rozciągania
             vec2 uv = v_uv;
             float aspectRatio = u_resolution.x / u_resolution.y;
             uv.x *= aspectRatio; // Skaluj X wg proporcji ekranu

            // Parametry z JS
            float time = u_time * ${TIME_SPEED.toFixed(4)}; // Czas dla osi Z
            float noiseScale = ${NOISE_SCALE.toFixed(4)};
            float flowSpeedX = ${FLOW_SPEED_X.toFixed(4)};
            float flowSpeedY = ${FLOW_SPEED_Y.toFixed(4)};

            // Współrzędne 3D dla próbkowania szumu
            // X, Y pochodzą z UV (z ew. przepływem), Z pochodzi z czasu
            vec3 coord = vec3(uv * noiseScale + vec2(time * flowSpeedX, time * flowSpeedY), time);

            // Oblicz wartość szumu FBM 3D
            float noiseValue = fbm3D(coord); // Wynik w zakresie ok. 0.0 - 1.0

            // Mapowanie wartości szumu na gradient kolorów Quantum Flux
            vec3 colorDark = vec3(0.008, 0.02, 0.063); // ~ --qf-bg-dark
            vec3 colorMid = vec3(0.039, 0.059, 0.125); // ~ --qf-bg-mid
            vec3 colorEnergyPrimary = vec3(0.314, 0.816, 1.0); // ~ --qf-energy-primary (błękit)
            vec3 colorEnergySecondary = vec3(1.0, 0.85, 0.0); // ~ --qf-energy-secondary (złoty)

            // Tworzenie gradientu: Ciemny -> Średni -> Jasny Błękit -> (Opcjonalnie) Złote akcenty
            vec3 color = mix(colorDark, colorMid, smoothstep(0.25, 0.5, noiseValue));
            color = mix(color, colorEnergyPrimary, smoothstep(0.5, 0.7, noiseValue)); // Jaśniejsze pasma błękitu

            // Dodaj złote akcenty dla najwyższych wartości szumu
            color = mix(color, colorEnergySecondary, smoothstep(0.75, 0.85, noiseValue));

            // Opcjonalnie: Dodanie lekkiego "migotania" do najjaśniejszych części
            // float flicker = sin(u_time * 1.5 + noiseValue * 8.0) * 0.1 + 0.9; // Wolniejsze migotanie
            // if (noiseValue > 0.65) {
            //     color *= flicker;
            // }

            // Ostateczny kolor piksela
            gl_FragColor = vec4(color, 1.0); // Nieprzezroczysty
        }
    `;

    // --- Funkcje pomocnicze WebGL (bez zmian) ---
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) return shader;
        console.error(`Błąd kompilacji shadera (${type === gl.VERTEX_SHADER ? "Vertex" : "Fragment"}):`, gl.getShaderInfoLog(shader));
        gl.deleteShader(shader); return null;
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) return program;
        console.error("Błąd linkowania programu WebGL:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program); return null;
    }

    // --- Inicjalizacja WebGL ---
    function setupWebGL() {
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
        // Zastąpione stałe w kodzie shadera (potrzebna ponowna kompilacja przy zmianie w JS)
        const fragmentShaderSource = fsSource
            .replace('#define OCTAVES 4', `#define OCTAVES ${OCTAVES}`)
            .replace('u_time * 0.0500', `u_time * ${TIME_SPEED.toFixed(4)}`)
            .replace('noiseScale = 2.5000', `noiseScale = ${NOISE_SCALE.toFixed(4)}`)
            .replace('flowSpeedX = 0.0000', `flowSpeedX = ${FLOW_SPEED_X.toFixed(4)}`)
            .replace('flowSpeedY = 0.0000', `flowSpeedY = ${FLOW_SPEED_Y.toFixed(4)}`);

        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        program = createProgram(gl, vertexShader, fragmentShader);

        if (!program) return false;

        // Lokalizacje atrybutów i uniformów
        positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        timeUniformLocation = gl.getUniformLocation(program, "u_time");

        // Bufor dla wierzchołków prostokąta (quad)
        positionBuffer = gl.createBuffer();
        const positions = [ -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1 ]; // Dwa trójkąty
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Usuwamy ustawienia blendowania, nie są potrzebne
        // gl.disable(gl.BLEND);

        return true;
    }

    // --- Dopasowanie rozmiaru Canvasa i pętla renderowania ---
    function resizeCanvasToDisplaySize(canvas) {
        const displayWidth  = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
            canvas.width  = displayWidth;
            canvas.height = displayHeight;
            return true;
        }
        return false;
    }

    function render(timestamp) {
        const elapsedTime = performance.now() - startTime; // Czas w milisekundach

        // Dopasuj rozmiar canvasa
        if (resizeCanvasToDisplaySize(gl.canvas)) {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        // Czyszczenie canvasa (choć nie jest ściśle konieczne, jeśli shader rysuje wszędzie)
        gl.clearColor(0, 0, 0, 1); // Czarny jako fallback
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Użyj programu WebGL
        gl.useProgram(program);

        // Włącz atrybut pozycji i powiąż bufor
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        // Ustaw uniformy (rozdzielczość i czas)
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(timeUniformLocation, elapsedTime / 1000.0); // czas w sekundach

        // Narysuj prostokąt (2 trójkąty = 6 wierzchołków)
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Poproś o następną klatkę animacji
        requestAnimationFrame(render);
    }

    // --- Start ---
    if (setupWebGL()) {
        requestAnimationFrame(render); // Rozpocznij pętlę renderowania
    }

    // Nasłuchiwanie na zmianę rozmiaru okna
    window.addEventListener('resize', () => {
        // Render sam dostosuje viewport w następnej klatce
    });

});

// --- END OF FILE background.js ---