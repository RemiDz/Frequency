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

  // Channel state (gain removed - now controlled by master gain only)
  const chan = {
    A:{ value:440 },
    B:{ value:528 }
  };

  // Elements for A
  const hzWheelA=document.getElementById('hzWheelA');
  const hzValueA=document.getElementById('hzValueA');
  // Elements for B
  const hzWheelB=document.getElementById('hzWheelB');
  const hzValueB=document.getElementById('hzValueB');





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
      
      // Add spinning animation for visual feedback
      wheelBody.classList.add('spinning');
      setTimeout(() => {
        wheelBody.classList.remove('spinning');
      }, 300);
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
      gNodeA.gain.linearRampToValueAtTime(masterGainValue, actx.currentTime+0.05);
      gNodeB.gain.linearRampToValueAtTime(masterGainValue, actx.currentTime+0.05);
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
    // Also update individual channel gains if playing
    if (isPlaying) {
      if (gNodeA) gNodeA.gain.value = masterGainValue;
      if (gNodeB) gNodeB.gain.value = masterGainValue;
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
    const categorySelects = ['solfeggioSelect', 'planetarySelect', 'healingSelect', 'musicalSelect', 'sacredSelect', 'brainwaveSelect'];
    categorySelects.forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        select.selectedIndex = 0; // Reset to first option (empty)
      }
    });
    selectedFreqPreset = null;
    
    const freqInfo = document.getElementById('freqInfo');
    if (freqInfo) {
      freqInfo.textContent = 'Choose a frequency from any category to automatically apply to both channels and start playing';
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
      const gCur = isPlaying ? masterGainValue : 0;
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
    ctx.fillStyle = 'rgba(25, 211, 197, 0.6)';
    ctx.font = '10px system-ui, sans-serif';
    const minFreq = 20;
    const maxFreq = 20000;
    for (let tick = 16; tick <= 16384; tick *= 2) {
      if (tick < minFreq || tick > maxFreq) continue;
      const y = view.height - (tick - minFreq) / (maxFreq - minFreq) * view.height;
      ctx.fillRect(0, y, 12, 1);
      ctx.fillText(`${tick}`, 15, y + 3);
    }
    
    // Current frequency line
    const y = view.height - (chan.value - minFreq) / (maxFreq - minFreq) * view.height;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(view.width, y);
    ctx.stroke();
    
    // Add a colored glow line underneath
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(view.width, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
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
        
        ctx.strokeStyle = 'rgba(25, 211, 197, 0.7)';
        ctx.lineWidth = 1.5;
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
    let hudText = `${chan.value.toFixed(1)} Hz • ${c.name}`;
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
      const gCur = isPlaying ? masterGainValue : 0;
      
      // Simple aura
      const R = 150;
      const alpha = Math.min(1, 0.2 + masterGainValue * 0.8);
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
        
        // Set pulse duration based on beat frequency
        const pulseDuration = beatInfo.beatFreq > 0 ? (1 / beatInfo.beatFreq) : 1;
        const beatDisplay = beatIndicator.querySelector('.beat-display');
        if (beatDisplay) {
          beatDisplay.style.setProperty('--beat-duration', `${pulseDuration}s`);
        }
      } else {
        beatIndicator.classList.remove('active');
      }
    } catch (e) {
      // Hide beat indicator if there's an error
      const beatIndicator = document.getElementById('beatIndicator');
      if (beatIndicator) {
        beatIndicator.classList.remove('active');
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
      gNodeA.gain.linearRampToValueAtTime(masterGainValue, actx.currentTime+0.05);
      gNodeB.gain.linearRampToValueAtTime(masterGainValue, actx.currentTime+0.05);
      
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



  // Comprehensive Frequency Library
  const frequencyPresets = {
    // Solfeggio Scale
    ut_174: { freq: 174, info: 'Ut - 174 Hz - Foundation of conscious evolution. Reduces pain and stress, provides sense of security.' },
    re_285: { freq: 285, info: 'Re - 285 Hz - Influences energy fields. Heals and regenerates tissues, enhances immune system.' },
    mi_396: { freq: 396, info: 'Mi - 396 Hz - Liberates from fear and guilt. Transforms grief into joy, negative thoughts into positive.' },
    fa_417: { freq: 417, info: 'Fa - 417 Hz - Facilitates change and undoing situations. Cleanses traumatic experiences and negative influences.' },
    sol_528: { freq: 528, info: 'Sol - 528 Hz - Love frequency and DNA repair. Transforms and miracles, repairs genetic structure.' },
    la_639: { freq: 639, info: 'La - 639 Hz - Connecting relationships. Enhances communication, love, understanding, and tolerance.' },
    ti_741: { freq: 741, info: 'Ti - 741 Hz - Awakening intuition. Cleanses cells from toxins, electromagnetic radiation.' },
    do_852: { freq: 852, info: 'Do - 852 Hz - Returning to spiritual order. Awakens intuition and helps return to spiritual order.' },
    high_963: { freq: 963, info: 'High - 963 Hz - Divine connection. Activates pineal gland, connects with universal energy.' },
    
    // Planetary Frequencies
    earth_day: { freq: 194.18, info: 'Earth Day - 194.18 Hz - Grounding and stability. Connects with Earth\'s daily rotation energy.' },
    earth_year: { freq: 136.1, info: 'Earth Year - 136.1 Hz - OM frequency. Earth\'s orbital frequency around the Sun, cosmic connection.' },
    moon: { freq: 210.42, info: 'Moon - 210.42 Hz - Intuition and emotional cycles. Lunar energy for feminine wisdom and intuition.' },
    mercury: { freq: 141.27, info: 'Mercury - 141.27 Hz - Communication and intellect. Enhances mental clarity and expression.' },
    venus: { freq: 221.23, info: 'Venus - 221.23 Hz - Love and beauty. Attracts love, harmony, and aesthetic appreciation.' },
    mars: { freq: 144.72, info: 'Mars - 144.72 Hz - Energy and action. Increases willpower, strength, and determination.' },
    jupiter: { freq: 183.58, info: 'Jupiter - 183.58 Hz - Growth and wisdom. Expands consciousness and promotes spiritual growth.' },
    saturn: { freq: 147.85, info: 'Saturn - 147.85 Hz - Structure and discipline. Brings order, responsibility, and life lessons.' },
    uranus: { freq: 207.36, info: 'Uranus - 207.36 Hz - Innovation and change. Promotes originality and sudden insights.' },
    neptune: { freq: 211.44, info: 'Neptune - 211.44 Hz - Spirituality and dreams. Enhances psychic abilities and imagination.' },
    pluto: { freq: 140.25, info: 'Pluto - 140.25 Hz - Transformation and rebirth. Deep psychological transformation and renewal.' },
    
    // Healing & Therapeutic
    pain_relief_40: { freq: 40, info: 'Pain Relief - 40 Hz - Stimulates endorphin release. Natural pain management and comfort.' },
    inflammation_728: { freq: 728, info: 'Anti-Inflammatory - 728 Hz - Reduces inflammation and swelling. Promotes healing processes.' },
    immune_boost_465: { freq: 465, info: 'Immune Boost - 465 Hz - Strengthens immune system. Enhances body\'s natural defense mechanisms.' },
    cellular_repair_285: { freq: 285, info: 'Cellular Repair - 285 Hz - Regenerates tissues and cells. Accelerates healing and recovery.' },
    detox_727: { freq: 727.5, info: 'Detoxification - 727.5 Hz - Cleanses toxins from body. Supports liver and kidney function.' },
    circulation_20: { freq: 20, info: 'Blood Circulation - 20 Hz - Improves blood flow. Enhances cardiovascular health and vitality.' },
    muscle_relax_304: { freq: 304, info: 'Muscle Relaxation - 304 Hz - Releases muscle tension. Promotes physical relaxation and comfort.' },
    nerve_regen_2720: { freq: 2720, info: 'Nerve Regeneration - 2720 Hz - Heals nervous system. Supports neural recovery and function.' },
    
    // Musical Notes (4th Octave)
    c4: { freq: 261.63, info: 'C4 - 261.63 Hz - Root chakra tone. Grounding, stability, and foundation energy.' },
    cs4: { freq: 277.18, info: 'C#4 - 277.18 Hz - Transition tone between root and sacral energies.' },
    d4: { freq: 293.66, info: 'D4 - 293.66 Hz - Sacral chakra tone. Creativity, sexuality, and emotional balance.' },
    ds4: { freq: 311.13, info: 'D#4 - 311.13 Hz - Transition tone enhancing creative expression.' },
    e4: { freq: 329.63, info: 'E4 - 329.63 Hz - Solar plexus tone. Personal power, confidence, and self-esteem.' },
    f4: { freq: 349.23, info: 'F4 - 349.23 Hz - Heart chakra tone. Love, compassion, and emotional healing.' },
    fs4: { freq: 369.99, info: 'F#4 - 369.99 Hz - Heart-throat bridge. Emotional expression and communication.' },
    g4: { freq: 392.00, info: 'G4 - 392.00 Hz - Throat chakra tone. Communication, truth, and self-expression.' },
    gs4: { freq: 415.30, info: 'G#4 - 415.30 Hz - Throat-third eye bridge. Intuitive communication.' },
    a4: { freq: 440.00, info: 'A4 - 440.00 Hz - Concert pitch standard. Universal tuning reference frequency.' },
    as4: { freq: 466.16, info: 'A#4 - 466.16 Hz - Third eye preparation. Enhances perception and awareness.' },
    b4: { freq: 493.88, info: 'B4 - 493.88 Hz - Crown chakra tone. Spiritual connection and enlightenment.' },
    
    // Sacred & Ancient
    schumann: { freq: 7.83, info: 'Schumann Resonance - 7.83 Hz - Earth\'s natural electromagnetic frequency. Promotes grounding and connection with nature.' },
    golden_ratio: { freq: 1.618, info: 'Golden Ratio - 1.618 Hz - Divine proportion frequency. Promotes harmony and natural balance.' },
    fibonacci_89: { freq: 89, info: 'Fibonacci - 89 Hz - Natural harmony sequence. Resonates with organic growth patterns.' },
    pyramid_51: { freq: 51.8, info: 'Great Pyramid - 51.8 Hz - Ancient wisdom frequency. Connects with pyramid energy and sacred geometry.' },
    crystal_bowls_432: { freq: 432, info: 'Crystal Bowls - 432 Hz - Universal harmony. Natural tuning that resonates with cosmic frequencies.' },
    tibetan_singing: { freq: 256, info: 'Tibetan Singing - 256 Hz - Meditation and mindfulness. Traditional frequency for spiritual practice.' },
    om_chant: { freq: 136.1, info: 'OM Chant - 136.1 Hz - Sacred sound of creation. Universal vibration and cosmic consciousness.' },
    angels_111: { freq: 111, info: 'Angel Frequency - 111 Hz - Divine connection and angelic communication. Spiritual guidance and protection.' },
    
    // Brainwave Entrainment
    delta_1: { freq: 1, info: 'Delta - 1 Hz - Deep sleep and unconscious. Promotes profound rest and cellular regeneration.' },
    delta_2: { freq: 2, info: 'Delta - 2 Hz - Healing sleep. Enhances natural healing processes during deep rest.' },
    theta_4: { freq: 4, info: 'Theta - 4 Hz - Deep meditation and trance. Accesses subconscious mind and spiritual insights.' },
    theta_6: { freq: 6, info: 'Theta - 6 Hz - Creativity and inspiration. Enhances artistic expression and innovative thinking.' },
    alpha_8: { freq: 8, info: 'Alpha - 8 Hz - Relaxed awareness. Calm, peaceful state with enhanced learning ability.' },
    alpha_10: { freq: 10, info: 'Alpha - 10 Hz - Calm focus and meditation. Balanced state of relaxed concentration.' },
    beta_14: { freq: 14, info: 'Beta - 14 Hz - Focused concentration. Enhanced cognitive function and problem-solving.' },
    beta_20: { freq: 20, info: 'Beta - 20 Hz - Active thinking and alertness. Peak mental performance and analytical thinking.' },
    gamma_40: { freq: 40, info: 'Gamma - 40 Hz - Heightened awareness. Increased perception and consciousness binding.' },
    gamma_70: { freq: 70, info: 'Gamma - 70 Hz - Cognitive enhancement. Advanced mental processing and expanded awareness.' }
  };
  
  let selectedFreqPreset = null;
  
  // Function to handle frequency selection from any category
  function handleFrequencySelection(selected) {
    console.log('Frequency selection:', selected);
    selectedFreqPreset = selected;
    if (selected && frequencyPresets[selected]) {
      // Clear binaural beat selections
      clearBinauralSelections();
      // Clear other frequency category selections
      clearOtherFrequencySelections(selected);
      
      document.getElementById('freqInfo').textContent = frequencyPresets[selected].info;
      
      // Auto-apply to both channels and start playing
      const freq = frequencyPresets[selected].freq;
      setValue('A', freq);
      setValue('B', freq);
      
      // Auto-start playing both channels
      ensureAudio();
      gNodeA.gain.linearRampToValueAtTime(masterGainValue, actx.currentTime+0.05);
      gNodeB.gain.linearRampToValueAtTime(masterGainValue, actx.currentTime+0.05);
      
      // Update master toggle button to show playing state
      const toggleBtn = document.getElementById('masterToggle');
      if (toggleBtn && !isPlaying) {
        toggleBtn.textContent = '⏸ Stop';
        toggleBtn.classList.add('playing');
        isPlaying = true;
      }
    } else {
      document.getElementById('freqInfo').textContent = 'Choose a frequency from any category to automatically apply to both channels and start playing';
    }
  }
  
  // Clear other frequency category selections when one is selected
  function clearOtherFrequencySelections(currentSelection) {
    const categorySelects = ['solfeggioSelect', 'planetarySelect', 'healingSelect', 'musicalSelect', 'sacredSelect', 'brainwaveSelect'];
    categorySelects.forEach(id => {
      const select = document.getElementById(id);
      if (select && select.value !== currentSelection) {
        select.value = '';
      }
    });
  }
  
  // Add event handlers for all frequency categories
  document.getElementById('solfeggioSelect').onchange = (e) => handleFrequencySelection(e.target.value);
  document.getElementById('planetarySelect').onchange = (e) => handleFrequencySelection(e.target.value);
  document.getElementById('healingSelect').onchange = (e) => handleFrequencySelection(e.target.value);
  document.getElementById('musicalSelect').onchange = (e) => handleFrequencySelection(e.target.value);
  document.getElementById('sacredSelect').onchange = (e) => handleFrequencySelection(e.target.value);
  document.getElementById('brainwaveSelect').onchange = (e) => handleFrequencySelection(e.target.value);
  


})();
