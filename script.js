// Sound Frequency Analyzer - Main Script

(() => {
  // Shared chakra maps
  const MAPS={
    standard:[
      {name:'Root',freq:396,color:'#b22222'},
      {name:'Sacral',freq:417,color:'#ff7f50'},
      {name:'Solar',freq:528,color:'#ffd700'},
      {name:'Heart',freq:639,color:'#32cd32'},
      {name:'Throat',freq:741,color:'#1e90ff'},
      {name:'Third Eye',freq:852,color:'#9370db'},
      {name:'Crown',freq:963,color:'#ee82ee'}
    ],
    solfeggio_528_heart:[
      {name:'Root',freq:396,color:'#b22222'},
      {name:'Sacral',freq:417,color:'#ff7f50'},
      {name:'Solar',freq:528,color:'#ffd700'},
      {name:'Heart',freq:528,color:'#32cd32'},
      {name:'Throat',freq:741,color:'#1e90ff'},
      {name:'Third Eye',freq:852,color:'#9370db'},
      {name:'Crown',freq:963,color:'#ee82ee'}
    ],
    solfeggio_528_solar:[
      {name:'Root',freq:396,color:'#b22222'},
      {name:'Sacral',freq:417,color:'#ff7f50'},
      {name:'Solar',freq:528,color:'#ffd700'},
      {name:'Heart',freq:639,color:'#32cd32'},
      {name:'Throat',freq:741,color:'#1e90ff'},
      {name:'Third Eye',freq:852,color:'#9370db'},
      {name:'Crown',freq:963,color:'#ee82ee'}
    ],
    harmonic_A:[
      {name:'Root',freq:110,color:'#b22222'},
      {name:'Sacral',freq:220,color:'#ff7f50'},
      {name:'Solar',freq:330,color:'#ffd700'},
      {name:'Heart',freq:440,color:'#32cd32'},
      {name:'Throat',freq:550,color:'#1e90ff'},
      {name:'Third Eye',freq:660,color:'#9370db'},
      {name:'Crown',freq:880,color:'#ee82ee'}
    ],
    c_major:[
      {name:'Root',freq:256,color:'#b22222'},
      {name:'Sacral',freq:288,color:'#ff7f50'},
      {name:'Solar',freq:320,color:'#ffd700'},
      {name:'Heart',freq:341,color:'#32cd32'},
      {name:'Throat',freq:384,color:'#1e90ff'},
      {name:'Third Eye',freq:426,color:'#9370db'},
      {name:'Crown',freq:512,color:'#ee82ee'}
    ]
  };

  const masterMapSelect = document.getElementById('masterMapSelect');
  const masterChakraBtns = document.getElementById('masterChakraBtns');

  // Store master chakra mapping for both channels
  let masterChakraMap = 'standard';

  function buildMasterChakraButtons(){
    const set = MAPS[masterChakraMap];
    const container = masterChakraBtns;
    
    container.innerHTML='';
    for(const c of set){
      const btn = document.createElement('button');
      btn.textContent = c.name;
      btn.style.background = c.color;
      btn.style.color = '#fff';
      btn.onclick = () => {
        // Clear other selections first
        clearBinauralSelections();
        clearFrequencyLibrarySelection();
        
        // Apply frequency to both channels
        setValue('A', c.freq);
        setValue('B', c.freq);
        // Auto-start playing if not already playing
        if (!isPlaying) {
          document.getElementById('masterToggle').click();
        }
      };
      btn.title = `${c.name}: ${c.freq} Hz - Apply to both channels`;
      container.appendChild(btn);
    }
  }

  // Channel state
  const chan = {
    A:{ value:440, gain:0.2 },
    B:{ value:528, gain:0.2 }
  };

  // Elements for A
  const hzWheelA=document.getElementById('hzWheelA');
  const hzValueA=document.getElementById('hzValueA');
  const gA=document.getElementById('gainA');
  const gainAVal=document.getElementById('gainAVal');
  // Elements for B
  const hzWheelB=document.getElementById('hzWheelB');
  const hzValueB=document.getElementById('hzValueB');
  const gB=document.getElementById('gainB');
  const gainBVal=document.getElementById('gainBVal');





  function setValue(which, v){
    const s = chan[which];
    s.value = Math.max(1, Math.min(20000, v));
    console.log(`Setting ${which} to ${s.value} Hz`);
    if(which==='A'){ 
      hzValueA.textContent=s.value.toFixed(1); 
      if(oscA) {
        oscA.frequency.value=s.value;
        console.log('Updated oscA frequency to', s.value);
      }
    }
    else { 
      hzValueB.textContent=s.value.toFixed(1); 
      if(oscB) {
        oscB.frequency.value=s.value;
        console.log('Updated oscB frequency to', s.value);
      }
    }
  }





  // Enhanced Audio graph with effects chains
  let actx, oscA, oscB, gNodeA, gNodeB, pannerA, pannerB, master, analyserA, analyserB, masterAnalyser;
  let effectsA = {}, effectsB = {};
  function ensureAudio(){
    if(!actx){
      try {
        actx=new (window.AudioContext||window.webkitAudioContext)();
        oscA=actx.createOscillator(); oscB=actx.createOscillator(); oscA.type='sine'; oscB.type='sine';
        gNodeA=actx.createGain(); gNodeB=actx.createGain(); gNodeA.gain.value=0.0001; gNodeB.gain.value=0.0001;
      
      // Create stereo panners for left/right separation
      pannerA=actx.createStereoPanner(); pannerA.pan.value=-1; // Channel A to left speaker
      pannerB=actx.createStereoPanner(); pannerB.pan.value=1;  // Channel B to right speaker
      
      master=actx.createGain(); master.gain.value=masterGainValue;
      
      // Create separate analysers for each channel and master mix
      analyserA=actx.createAnalyser(); analyserA.fftSize=4096; analyserA.smoothingTimeConstant=0.1;
      analyserB=actx.createAnalyser(); analyserB.fftSize=4096; analyserB.smoothingTimeConstant=0.1;
      masterAnalyser=actx.createAnalyser(); masterAnalyser.fftSize=4096; masterAnalyser.smoothingTimeConstant=0.1;
      
      // Setup filter nodes
      setupFilters();
      
      // Connect with filter chains and stereo separation
      oscA.connect(gNodeA); oscB.connect(gNodeB);
      
      // Route through filter chains
      if (effectsA.filter) {
        gNodeA.connect(effectsA.filter);
        effectsA.filter.connect(analyserA);
        effectsA.filter.connect(pannerA);
      } else {
        gNodeA.connect(analyserA);
        gNodeA.connect(pannerA);
      }
      
      if (effectsB.filter) {
        gNodeB.connect(effectsB.filter);
        effectsB.filter.connect(analyserB);
        effectsB.filter.connect(pannerB);
      } else {
        gNodeB.connect(analyserB);
        gNodeB.connect(pannerB);
      }
      
      pannerA.connect(master); pannerB.connect(master);
      master.connect(masterAnalyser); // Master analyser for beat detection
      master.connect(actx.destination);
      
        oscA.start(); oscB.start();
        // Init freqs
        oscA.frequency.value=chan.A.value; oscB.frequency.value=chan.B.value;
        console.log('Audio context initialized successfully');
      } catch (e) {
        console.error('Failed to initialize audio context:', e);
      }
    }
  }

  // Setup filter nodes
  function setupFilters() {
    try {
      // Filter for Channel A
      effectsA.filter = actx.createBiquadFilter();
      effectsA.filter.type = 'allpass';
      effectsA.filter.frequency.value = 2000;
      
      // Filter for Channel B
      effectsB.filter = actx.createBiquadFilter();
      effectsB.filter.type = 'allpass';
      effectsB.filter.frequency.value = 2000;
      
    } catch (e) {
      console.warn('Filter setup failed:', e);
      // Fallback: no filters
      effectsA = {};
      effectsB = {};
    }
  }



  // Create ticking sound for wheel interaction
  let tickAudioContext = null;
  let tickGainNode = null;
  
  function createTickSound() {
    if (!tickAudioContext) {
      try {
        tickAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        tickGainNode = tickAudioContext.createGain();
        tickGainNode.connect(tickAudioContext.destination);
        tickGainNode.gain.value = 0.1; // Soft volume
      } catch (e) {
        console.warn('Could not create tick audio context:', e);
        return;
      }
    }
    
    try {
      const oscillator = tickAudioContext.createOscillator();
      const gainNode = tickAudioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(tickGainNode);
      
      // Create a soft tick sound
      oscillator.frequency.value = 800; // High pitch tick
      oscillator.type = 'sine';
      
      // Quick envelope for tick sound
      const now = tickAudioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      oscillator.start(now);
      oscillator.stop(now + 0.05);
    } catch (e) {
      // Silently fail if audio creation fails
    }
  }

  // Hz Roller Implementation (texture scroll)
  function setupHzMouseWheel(element, channel) {
    let startY = 0;
    let startValue = 0;
    let isDragging = false;
    let lastTickTime = 0;
    let wheelOffset = -1000; // matches CSS top for tall texture
    
    const wheelBody = element.querySelector('.roller-wheel') || element.querySelector('.wheel-body');
    let currentRotation = 0;
    
    // Calculate increment based on frequency range
    function getIncrement(currentValue) {
      if (currentValue < 20) return 0.1;
      if (currentValue < 100) return 0.5;
      if (currentValue < 1000) return 1;
      if (currentValue < 5000) return 5;
      return 10;
    }
    
    // Animate wheel rotation
    function animateWheelRotation(direction, steps) {
      if (!wheelBody) return;
      const pxPerStep = 6;
      const delta = (direction > 0 ? -1 : 1) * pxPerStep * (steps || 1);
      wheelOffset += delta;
      if (wheelOffset > -100) wheelOffset = -1000;
      if (wheelOffset < -1900) wheelOffset = -1000;
      wheelBody.style.top = wheelOffset + 'px';
    }
    
    // Play tick sound with throttling
    function playTick() {
      const now = Date.now();
      if (now - lastTickTime > 50) { // Throttle to max 20 ticks per second
        createTickSound();
        lastTickTime = now;
      }
    }
    
    // Handle wheel events (desktop)
    element.addEventListener('wheel', (e) => {
      e.preventDefault();
      clearBinauralSelections();
      clearFrequencyLibrarySelection();
      
      const currentValue = chan[channel].value;
      const increment = getIncrement(currentValue);
      const direction = e.deltaY > 0 ? -1 : 1;
      const delta = direction * increment;
      
      setValue(channel, currentValue + delta);
      animateWheelRotation(direction);
      playTick();
    }, { passive: false });
    
    // Handle touch events (mobile)
    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      startY = e.touches[0].clientY;
      startValue = chan[channel].value;
      element.style.transform = 'scale(0.98)';
    }, { passive: false });
    
    element.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY; // Inverted for natural scroll direction
      const sensitivity = 3; // Adjust sensitivity for mobile
      const currentValue = chan[channel].value;
      const increment = getIncrement(currentValue);
      
      // Smooth incremental changes
      const steps = Math.floor(Math.abs(deltaY) / sensitivity);
      if (steps > 0) {
        const direction = deltaY > 0 ? 1 : -1;
        const newValue = startValue + (steps * increment * direction);
        setValue(channel, newValue);
        startY = currentY; // Update start position for continuous scrolling
        startValue = chan[channel].value;
        
        animateWheelRotation(direction, steps);
        playTick();
        
        clearBinauralSelections();
        clearFrequencyLibrarySelection();
      }
    }, { passive: false });
    
    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      isDragging = false;
      element.style.transform = 'scale(1)';
    }, { passive: false });
    
    // Handle mouse events (desktop drag)
    element.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      startY = e.clientY;
      startValue = chan[channel].value;
      element.style.transform = 'scale(0.98)';
      
      // Add global mouse event listeners
      const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const currentY = e.clientY;
        const deltaY = startY - currentY;
        const sensitivity = 4;
        const currentValue = chan[channel].value;
        const increment = getIncrement(currentValue);
        
        const steps = Math.floor(Math.abs(deltaY) / sensitivity);
        if (steps > 0) {
          const direction = deltaY > 0 ? 1 : -1;
          const newValue = startValue + (steps * increment * direction);
          setValue(channel, newValue);
          startY = currentY;
          startValue = chan[channel].value;
          
          animateWheelRotation(direction, steps);
          playTick();
          
          clearBinauralSelections();
          clearFrequencyLibrarySelection();
        }
      };
      
      const handleMouseUp = (e) => {
        e.preventDefault();
        isDragging = false;
        element.style.transform = 'scale(1)';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    
    // Prevent context menu on long press
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  
  // Initialize mouse wheels
  setupHzMouseWheel(hzWheelA, 'A');
  setupHzMouseWheel(hzWheelB, 'B');

  // Gain sliders
  gA.oninput=()=>{ chan.A.gain=+gA.value/100; gainAVal.textContent=gA.value+'%'; if(gNodeA && isPlaying) gNodeA.gain.value=chan.A.gain; };
  gB.oninput=()=>{ chan.B.gain=+gB.value/100; gainBVal.textContent=gB.value+'%'; if(gNodeB && isPlaying) gNodeB.gain.value=chan.B.gain; };

  // Master wave type control
  document.getElementById('masterWaveType').onchange = (e) => {
    if (oscA) oscA.type = e.target.value;
    if (oscB) oscB.type = e.target.value;
  };

  // Master Controls
  let masterGainValue = 1.0;
  let isPlaying = false;
  
  document.getElementById('masterToggle').onclick = () => {
    const toggleBtn = document.getElementById('masterToggle');
    
    if (!isPlaying) {
      // Start playing
      ensureAudio();
      gNodeA.gain.linearRampToValueAtTime(chan.A.gain, actx.currentTime+0.05);
      gNodeB.gain.linearRampToValueAtTime(chan.B.gain, actx.currentTime+0.05);
      toggleBtn.textContent = '⏸ Stop';
      toggleBtn.classList.add('playing');
      isPlaying = true;
    } else {
      // Stop playing
      if(gNodeA) gNodeA.gain.linearRampToValueAtTime(0.0001, actx.currentTime+0.05);
      if(gNodeB) gNodeB.gain.linearRampToValueAtTime(0.0001, actx.currentTime+0.05);
      toggleBtn.textContent = '▶ Play';
      toggleBtn.classList.remove('playing');
      isPlaying = false;
    }
  };
  
  document.getElementById('masterGain').oninput = (e) => {
    masterGainValue = +e.target.value / 100;
    document.getElementById('masterGainVal').textContent = e.target.value + '%';
    if (master) {
      master.gain.value = masterGainValue;
    }
  };

  // Master mapping selector
  masterMapSelect.onchange = () => {
    masterChakraMap = masterMapSelect.value;
    buildMasterChakraButtons();
  };
  
  buildMasterChakraButtons();

  // Clear binaural beat category selections
  function clearBinauralSelections() {
    const categorySelects = ['sleepSelect', 'meditationSelect', 'relaxationSelect', 'focusSelect', 'advancedSelect', 'therapeuticSelect'];
    categorySelects.forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        select.selectedIndex = 0; // Reset to first option (empty)
      }
    });
    
    const beatInfo = document.getElementById('beatInfo');
    if (beatInfo) {
      beatInfo.textContent = 'Select any brainwave state from the categories above to automatically set frequencies and start playing optimal binaural beats';
    }
  }
  
  // Clear frequency library selection
  function clearFrequencyLibrarySelection() {
    const freqPresetSelect = document.getElementById('freqPresetSelect');
    if (freqPresetSelect) {
      freqPresetSelect.selectedIndex = 0; // Reset to first option (empty)
    }
    selectedFreqPreset = null;
    
    const freqInfo = document.getElementById('freqInfo');
    if (freqInfo) {
      freqInfo.textContent = 'Choose a frequency to automatically apply to both channels and start playing';
    }
  }
  
  // Reset form elements to default state on page load (simplified)
  function resetFormElements() {
    clearBinauralSelections();
    clearFrequencyLibrarySelection();
  }
  


  // Master filter control
  document.getElementById('masterFilterType').onchange = (e) => {
    const filterType = e.target.value === 'none' ? 'allpass' : e.target.value;
    if (effectsA.filter) {
      effectsA.filter.type = filterType;
    }
    if (effectsB.filter) {
      effectsB.filter.type = filterType;
    }
  };

  // Spectrum + aura render for dual panels
  const viewA=document.getElementById('viewA'); const ctxA=viewA.getContext('2d'); const hudA=document.getElementById('hudA');
  const viewB=document.getElementById('viewB'); const ctxB=viewB.getContext('2d'); const hudB=document.getElementById('hudB');
  const specA = new Uint8Array(2048);
  const specB = new Uint8Array(2048);
  const masterSpec = new Uint8Array(2048);
  const timeDataA = new Float32Array(4096);
  const timeDataB = new Float32Array(4096);
  const masterTimeData = new Float32Array(4096);
  
  // Beat frequency detection variables
  let beatHistory = [];
  let lastAmplitudeTime = 0;

  function nearestChakra(f){
    const set = MAPS[masterChakraMap];
    let best = set[0], d = Math.abs(f - best.freq);
    for(const c of set){
      const dc = Math.abs(f - c.freq);
      if(dc < d){
        best = c;
        d = dc;
      }
    }
    return best;
  }

  function hexToRgba(hex, a){ const v = hex.replace('#',''); const r=parseInt(v.substring(0,2),16), g=parseInt(v.substring(2,4),16), b=parseInt(v.substring(4,6),16); return `rgba(${r},${g},${b},${a})`; }

  // Calculate beat frequency and amplitude modulation
  function calculateBeatInfo() {
    if (!masterAnalyser || !isPlaying) return { beatFreq: 0, amplitude: 0, modulation: 0 };
    
    // Calculate theoretical beat frequency
    const freqDiff = Math.abs(chan.A.value - chan.B.value);
    const beatFreq = freqDiff;
    
    // Get real-time amplitude data
    masterAnalyser.getFloatTimeDomainData(masterTimeData);
    
    // Calculate RMS amplitude
    let sumSquares = 0;
    for (let i = 0; i < masterTimeData.length; i++) {
      sumSquares += masterTimeData[i] * masterTimeData[i];
    }
    const rms = Math.sqrt(sumSquares / masterTimeData.length);
    
    // Track amplitude over time for modulation detection
    const now = performance.now();
    beatHistory.push({ time: now, amplitude: rms });
    
    // Keep only recent history (last 2 seconds)
    beatHistory = beatHistory.filter(entry => now - entry.time < 2000);
    
    // Calculate amplitude modulation depth
    if (beatHistory.length < 10) return { beatFreq, amplitude: rms, modulation: 0 };
    
    const amplitudes = beatHistory.map(entry => entry.amplitude);
    const maxAmp = Math.max(...amplitudes);
    const minAmp = Math.min(...amplitudes);
    const modulation = maxAmp > 0 ? (maxAmp - minAmp) / maxAmp : 0;
    
    return { beatFreq, amplitude: rms, modulation };
  }

  function drawChannel(ctx, view, analyser, spec, chan, channelKey, hud) {
    try {
      ctx.clearRect(0, 0, view.width, view.height);
      
      const c = nearestChakra(chan.value);
      const gCur = isPlaying ? chan.gain : 0;
      const t = performance.now() / 1000;
      
      // Basic aura pulsing (always works)
      let pulse = 1 + 0.15 * gCur * Math.sin(t * chan.value * 0.02);
      
      // Try to get beat information for enhanced visualization (with error handling)
      try {
        const beatInfo = calculateBeatInfo();
        // Add beat frequency pulsing when both channels are active
        if (isPlaying && beatInfo.beatFreq > 0.1) {
          const beatPulse = 1 + beatInfo.modulation * 0.5 * Math.sin(t * beatInfo.beatFreq * 2 * Math.PI);
          pulse *= beatPulse;
        }
      } catch (e) {
        // Continue with basic visualization if beat calculation fails
      }
      
      const R = 180 * pulse;
      const alpha = Math.min(1, 0.15 + gCur * 0.85);
    
    const grd = ctx.createRadialGradient(view.width * 0.5, view.height * 0.5, 0, view.width * 0.5, view.height * 0.5, R);
    grd.addColorStop(0, hexToRgba(c.color, alpha));
    grd.addColorStop(1, hexToRgba('#000000', 0));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, view.width, view.height);
    
    // Hz scale
    ctx.fillStyle = '#445';
    ctx.font = '10px system-ui, sans-serif';
    const minFreq = 20;
    const maxFreq = 20000;
    for (let tick = 16; tick <= 16384; tick *= 2) {
      if (tick < minFreq || tick > maxFreq) continue;
      const y = view.height - (tick - minFreq) / (maxFreq - minFreq) * view.height;
      ctx.fillRect(0, y, 8, 1);
      ctx.fillText(`${tick}`, 10, y + 3);
    }
    
    // Current frequency line
    const y = view.height - (chan.value - minFreq) / (maxFreq - minFreq) * view.height;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(view.width, y);
    ctx.stroke();
    
    // Spectrum visualization (simplified and robust)
    if (analyser) {
      try {
        analyser.getByteFrequencyData(spec);
        const barW = (view.width - 40) / 256; // Use first 256 bins for clarity
        let x = 20;
        
        // Draw spectrum bars
        ctx.fillStyle = c.color;
        for (let i = 0; i < 256; i++) {
          const h = spec[i] * 0.8;
          ctx.fillRect(x, view.height - h - 30, barW * 0.8, h);
          x += barW;
        }
        
        // Frequency marker
        if (actx) {
          const nyquist = actx.sampleRate / 2;
          const bin = Math.round(chan.value / nyquist * 256);
          const mx = 20 + barW * bin;
          ctx.fillStyle = '#fff';
          ctx.fillRect(mx - 1, view.height - 32, 2, 30);
        }
      } catch (e) {
        // Skip spectrum if there's an error
      }
    }
    
    // Real-time amplitude visualization (simplified waveform)
    try {
      if (analyser) {
        const timeData = channelKey === 'A' ? timeDataA : timeDataB;
        analyser.getFloatTimeDomainData(timeData);
        
        ctx.strokeStyle = hexToRgba(c.color, 0.4);
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const sliceWidth = view.width / 512; // Use fewer samples for performance
        let x = 0;
        
        for (let i = 0; i < 512; i++) {
          const v = timeData[i * 8] * 30 + view.height * 0.25; // Sample every 8th point and scale
          if (i === 0) {
            ctx.moveTo(x, v);
          } else {
            ctx.lineTo(x, v);
          }
          x += sliceWidth;
        }
        ctx.stroke();
      }
    } catch (e) {
      // Skip waveform if there's an error
    }
    
    // Enhanced HUD with beat frequency info
    let hudText = `${chan.value.toFixed(1)} Hz • ${c.name} • ${(chan.gain * 100).toFixed(0)}%`;
    if (!isPlaying) {
      hudText += ' (Stopped)';
    }
    
    // Add beat frequency information when both channels are active (with error handling)
    try {
      const beatInfo = calculateBeatInfo();
      if (isPlaying && beatInfo.beatFreq > 0.1) {
        hudText += ` • Beat: ${beatInfo.beatFreq.toFixed(1)} Hz`;
        if (beatInfo.modulation > 0.1) {
          hudText += ` • Mod: ${(beatInfo.modulation * 100).toFixed(0)}%`;
        }
      }
    } catch (e) {
      // Ignore beat info if there's an error
    }
    
      hud.textContent = hudText;
    } catch (e) {
      console.error('Error in drawChannel:', e);
      // Fallback: draw basic visualization
      ctx.clearRect(0, 0, view.width, view.height);
      const c = nearestChakra(chan.value);
      const gCur = isPlaying ? chan.gain : 0;
      
      // Simple aura
      const R = 150;
      const alpha = Math.min(1, 0.2 + gCur * 0.8);
      const grd = ctx.createRadialGradient(view.width * 0.5, view.height * 0.5, 0, view.width * 0.5, view.height * 0.5, R);
      grd.addColorStop(0, hexToRgba(c.color, alpha));
      grd.addColorStop(1, hexToRgba('#000000', 0));
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, view.width, view.height);
      
      // Simple HUD
      hud.textContent = `${chan.value.toFixed(1)} Hz • ${c.name}`;
    }
  }

  function draw() {
    // Update beat indicator (with error handling)
    try {
      const beatInfo = calculateBeatInfo();
      const beatIndicator = document.getElementById('beatIndicator');
      const beatFreqDisplay = document.getElementById('beatFreqDisplay');
      
      if (isPlaying && beatInfo.beatFreq > 0.1 && beatInfo.modulation > 0.05) {
        beatIndicator.classList.add('active');
        beatFreqDisplay.textContent = `${beatInfo.beatFreq.toFixed(1)} Hz`;
        
        // Pulse the beat indicator at the beat frequency
        const t = performance.now() / 1000;
        const pulse = 0.7 + 0.3 * Math.sin(t * beatInfo.beatFreq * 2 * Math.PI);
        beatIndicator.style.transform = `scale(${pulse})`;
      } else {
        beatIndicator.classList.remove('active');
        beatIndicator.style.transform = 'scale(1)';
      }
    } catch (e) {
      // Hide beat indicator if there's an error
      const beatIndicator = document.getElementById('beatIndicator');
      if (beatIndicator) {
        beatIndicator.classList.remove('active');
        beatIndicator.style.transform = 'scale(1)';
      }
    }
    
    // Draw Channel A (Left)
    if (analyserA) {
      drawChannel(ctxA, viewA, analyserA, specA, chan.A, 'A', hudA);
    }
    
    // Draw Channel B (Right)
    if (analyserB) {
      drawChannel(ctxB, viewB, analyserB, specB, chan.B, 'B', hudB);
    }
    
    requestAnimationFrame(draw);
  }

  // Set initial values and start visualization
  setValue('A', chan.A.value); 
  setValue('B', chan.B.value);
  
  // Start the visualization loop
  draw();
  
  // Reset form elements on page load with proper timing
  setTimeout(() => {
    console.log('Calling resetFormElements');
    resetFormElements();
  }, 1000);



  // Advanced Features Implementation
  
  // Session Timer
  let timerInterval = null;
  let timerSeconds = 0;
  let timerRunning = false;
  
  function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    document.getElementById('timerDisplay').textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  window.setTimer = function(minutes) {
    timerSeconds = minutes * 60;
    updateTimerDisplay();
  }
  
  document.getElementById('timerStart').onclick = () => {
    if (!timerRunning) {
      timerRunning = true;
      timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
          timerSeconds--;
          updateTimerDisplay();
        } else {
          // Timer finished - stop all sounds
          document.getElementById('timerPause').click();
          if(gNodeA) gNodeA.gain.linearRampToValueAtTime(0.0001, actx.currentTime+0.05);
          if(gNodeB) gNodeB.gain.linearRampToValueAtTime(0.0001, actx.currentTime+0.05);
          // Update master toggle button
          const toggleBtn = document.getElementById('masterToggle');
          if (toggleBtn) {
            toggleBtn.textContent = '▶ Play';
            toggleBtn.classList.remove('playing');
            isPlaying = false;
          }
          alert('Session complete! 🎵');
        }
      }, 1000);
      document.getElementById('timerStart').textContent = 'Running...';
    }
  };
  
  document.getElementById('timerPause').onclick = () => {
    if (timerRunning) {
      timerRunning = false;
      clearInterval(timerInterval);
      document.getElementById('timerStart').textContent = 'Start';
    }
  };
  
  document.getElementById('timerReset').onclick = () => {
    timerRunning = false;
    clearInterval(timerInterval);
    timerSeconds = 0;
    updateTimerDisplay();
    document.getElementById('timerStart').textContent = 'Start';
  };

  // Comprehensive Binaural Beat Library
  const brainwavePresets = {
    // Sleep & Rest (0.5-4 Hz)
    deep_sleep: { 
      base: 80, beat: 0.5, 
      info: 'Deep Sleep (0.5 Hz) - Promotes profound rest and physical recovery. Ideal for insomnia and deep healing sleep.' 
    },
    delta: { 
      base: 100, beat: 2, 
      info: 'Delta Sleep (2 Hz) - Natural healing sleep frequency. Enhances immune system and cellular repair.' 
    },
    delta_healing: { 
      base: 120, beat: 3, 
      info: 'Delta Healing (3 Hz) - Accelerates physical healing and recovery. Reduces inflammation and promotes tissue repair.' 
    },
    
    // Meditation & Spirituality (4-8 Hz)
    theta_deep: { 
      base: 150, beat: 4, 
      info: 'Deep Theta (4 Hz) - Profound meditative states. Enhances spiritual connection and inner wisdom.' 
    },
    theta: { 
      base: 200, beat: 6, 
      info: 'Theta (6 Hz) - Classic meditation frequency. Boosts creativity, intuition, and emotional healing.' 
    },
    theta_intuition: { 
      base: 220, beat: 7.5, 
      info: 'Theta Intuition (7.5 Hz) - Heightens psychic awareness and spiritual insight. Gateway to subconscious mind.' 
    },
    schumann: { 
      base: 240, beat: 7.83, 
      info: 'Schumann Resonance (7.83 Hz) - Earth\'s natural frequency. Promotes grounding, balance, and connection with nature.' 
    },
    
    // Relaxation & Calm (8-13 Hz)
    alpha_deep: { 
      base: 180, beat: 8, 
      info: 'Deep Alpha (8 Hz) - Deep relaxation and stress relief. Ideal for anxiety reduction and mental peace.' 
    },
    alpha: { 
      base: 220, beat: 10, 
      info: 'Alpha (10 Hz) - Calm, focused awareness. Perfect for mindful meditation and relaxed concentration.' 
    },
    alpha_learning: { 
      base: 250, beat: 12, 
      info: 'Alpha Learning (12 Hz) - Accelerated learning state. Enhances memory retention and information processing.' 
    },
    
    // Focus & Productivity (13-30 Hz)
    beta_low: { 
      base: 200, beat: 14, 
      info: 'Low Beta (14 Hz) - Relaxed focus and problem-solving. Ideal for creative work and gentle concentration.' 
    },
    beta: { 
      base: 250, beat: 20, 
      info: 'Beta (20 Hz) - Active concentration and mental alertness. Perfect for analytical work and studying.' 
    },
    beta_high: { 
      base: 280, beat: 25, 
      info: 'High Beta (25 Hz) - Peak performance and intense focus. Enhances cognitive processing and decision-making.' 
    },
    
    // Advanced States (30-100 Hz)
    gamma_low: { 
      base: 200, beat: 35, 
      info: 'Low Gamma (35 Hz) - Enhanced awareness and perception. Improves sensory processing and consciousness.' 
    },
    gamma: { 
      base: 300, beat: 40, 
      info: 'Gamma (40 Hz) - Cognitive enhancement and binding consciousness. Increases memory and learning capacity.' 
    },
    gamma_high: { 
      base: 350, beat: 60, 
      info: 'High Gamma (60 Hz) - Expanded consciousness and heightened awareness. Advanced meditation and spiritual states.' 
    },
    
    // Therapeutic Applications
    pain_relief: { 
      base: 90, beat: 1.5, 
      info: 'Pain Relief (1.5 Hz) - Natural analgesia through endorphin release. Reduces chronic pain and inflammation.' 
    },
    stress_relief: { 
      base: 200, beat: 9, 
      info: 'Stress Relief (9 Hz) - Rapid anxiety reduction and emotional balance. Calms nervous system and reduces cortisol.' 
    },
    memory: { 
      base: 240, beat: 15, 
      info: 'Memory Enhancement (15 Hz) - Improves memory formation and recall. Enhances learning and cognitive function.' 
    },
    mood_boost: { 
      base: 260, beat: 18, 
      info: 'Mood Enhancement (18 Hz) - Natural mood elevation and emotional balance. Increases serotonin and dopamine.' 
    },
    energy: { 
      base: 280, beat: 22, 
      info: 'Energy Boost (22 Hz) - Mental alertness and physical vitality. Combats fatigue and increases motivation.' 
    }
  };
  
  // Function to handle binaural beat selection
  function handleBinauralSelection(selected) {
    console.log('Binaural selection:', selected);
    if (selected && brainwavePresets[selected]) {
      // Clear frequency library selection
      clearFrequencyLibrarySelection();
      
      const preset = brainwavePresets[selected];
      console.log('Applying preset:', preset);
      setValue('A', preset.base);
      setValue('B', preset.base + preset.beat);
      document.getElementById('beatInfo').textContent = preset.info;
      
      // Auto-start playing both channels
      ensureAudio();
      gNodeA.gain.linearRampToValueAtTime(chan.A.gain, actx.currentTime+0.05);
      gNodeB.gain.linearRampToValueAtTime(chan.B.gain, actx.currentTime+0.05);
      
      // Update master toggle button to show playing state
      const toggleBtn = document.getElementById('masterToggle');
      if (toggleBtn) {
        toggleBtn.textContent = '⏸ Stop';
        toggleBtn.classList.add('playing');
        isPlaying = true;
      }
      
      // Clear other category selections
      const categorySelects = ['sleepSelect', 'meditationSelect', 'relaxationSelect', 'focusSelect', 'advancedSelect', 'therapeuticSelect'];
      categorySelects.forEach(id => {
        const select = document.getElementById(id);
        if (select && select.value === selected) {
          // Keep this one selected
        } else if (select) {
          select.value = '';
        }
      });
    }
  }
  
  // Auto-apply and play when any category selection changes
  document.getElementById('sleepSelect').onchange = (e) => handleBinauralSelection(e.target.value);
  document.getElementById('meditationSelect').onchange = (e) => handleBinauralSelection(e.target.value);
  document.getElementById('relaxationSelect').onchange = (e) => handleBinauralSelection(e.target.value);
  document.getElementById('focusSelect').onchange = (e) => handleBinauralSelection(e.target.value);
  document.getElementById('advancedSelect').onchange = (e) => handleBinauralSelection(e.target.value);
  document.getElementById('therapeuticSelect').onchange = (e) => handleBinauralSelection(e.target.value);



  // Frequency Library
  const frequencyPresets = {
    schumann: { 
      freq: 7.83, 
      info: 'Schumann Resonance - Earth\'s natural electromagnetic frequency. Promotes grounding and connection with nature.' 
    },
    om: { 
      freq: 136.1, 
      info: 'OM Frequency - Sacred sound in many traditions. Calculated from Earth\'s orbital frequency around the Sun.' 
    },
    golden: { 
      freq: 1.618, 
      info: 'Golden Ratio Frequency - Based on the mathematical golden ratio (φ). Promotes harmony and balance.' 
    },
    dna_repair: { 
      freq: 528, 
      info: 'DNA Repair Frequency - Part of Solfeggio scale. Believed to promote healing and DNA repair processes.' 
    },
    love: { 
      freq: 528, 
      info: 'Love Frequency - Known as the "Miracle Tone". Associated with love, healing, and transformation.' 
    },
    transformation: { 
      freq: 741, 
      info: 'Transformation Frequency - Solfeggio tone for cleansing and problem-solving. Awakens intuition.' 
    },
    intuition: { 
      freq: 852, 
      info: 'Intuition Frequency - Enhances spiritual awareness and returns to spiritual order.' 
    },
    pineal: { 
      freq: 963, 
      info: 'Pineal Activation - Highest Solfeggio frequency. Connects to divine consciousness and universal energy.' 
    }
  };
  
  let selectedFreqPreset = null;
  
  document.getElementById('freqPresetSelect').onchange = (e) => {
    const selected = e.target.value;
    selectedFreqPreset = selected;
    if (selected && frequencyPresets[selected]) {
      // Clear binaural beat selections
      clearBinauralSelections();
      
      document.getElementById('freqInfo').textContent = frequencyPresets[selected].info;
      
      // Auto-apply to both channels and start playing
      const freq = frequencyPresets[selected].freq;
      setValue('A', freq);
      setValue('B', freq);
      
      // Auto-start playing both channels
      ensureAudio();
      gNodeA.gain.linearRampToValueAtTime(chan.A.gain, actx.currentTime+0.05);
      gNodeB.gain.linearRampToValueAtTime(chan.B.gain, actx.currentTime+0.05);
    } else {
      document.getElementById('freqInfo').textContent = 'Choose a frequency to automatically apply to both channels and start playing';
    }
  };
  


})();
