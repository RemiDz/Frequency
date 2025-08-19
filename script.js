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

  const mapSelectA = document.getElementById('mapSelectA');
  const mapSelectB = document.getElementById('mapSelectB');
  const chakraBtnsA = document.getElementById('chakraBtnsA');
  const chakraBtnsB = document.getElementById('chakraBtnsB');

  // Store individual chakra mappings for each channel
  const channelMaps = {
    A: 'standard',
    B: 'standard'
  };

  function buildChakraButtons(channel){
    const mapKey = channelMaps[channel];
    const set = MAPS[mapKey];
    const container = channel === 'A' ? chakraBtnsA : chakraBtnsB;
    
    container.innerHTML='';
    for(const c of set){
      const btn = document.createElement('button');
      btn.textContent = c.name;
      btn.style.background = c.color;
      btn.style.color = '#fff';
      btn.onclick = () => setValue(channel, c.freq);
      btn.title = `${c.name}: ${c.freq} Hz`;
      container.appendChild(btn);
    }
  }

  function buildAllChakraButtons(){
    buildChakraButtons('A');
    buildChakraButtons('B');
  }

  // Channel state
  const chan = {
    A:{ value:440, min:20, max:8000, gain:0.2, muted:false },
    B:{ value:528, min:20, max:8000, gain:0.2, muted:false }
  };

  // Elements for A
  const knobA=document.getElementById('knobA'), indA=document.getElementById('indicatorA'), scaleA=document.getElementById('scaleA');
  const hzInputA=document.getElementById('hzInputA');
  const minA=document.getElementById('minA'), maxA=document.getElementById('maxA'), gA=document.getElementById('gainA');
  const minAVal=document.getElementById('minAVal'), maxAVal=document.getElementById('maxAVal'), gainAVal=document.getElementById('gainAVal');
  // Elements for B
  const knobB=document.getElementById('knobB'), indB=document.getElementById('indicatorB'), scaleB=document.getElementById('scaleB');
  const hzInputB=document.getElementById('hzInputB');
  const minB=document.getElementById('minB'), maxB=document.getElementById('maxB'), gB=document.getElementById('gainB');
  const minBVal=document.getElementById('minBVal'), maxBVal=document.getElementById('maxBVal'), gainBVal=document.getElementById('gainBVal');

  // Build ticks
  function buildTicks(scaleEl){
    for(let i=0;i<=50;i++){ const el=document.createElement('div'); el.className='tick'; const a=-135+270*(i/50); el.style.transform=`translate(-50%,-50%) rotate(${a}deg) translate(0,-65px)`; scaleEl.appendChild(el); }
  }
  buildTicks(scaleA); buildTicks(scaleB);

  // Mapping helpers
  function valueToAngle(v,min,max){ const t=(Math.log(v)-Math.log(min))/(Math.log(max)-Math.log(min)); return -135+270*t; }
  function angleToValue(a,min,max){ const t=(a+135)/270; return Math.exp(Math.log(min)+t*(Math.log(max)-Math.log(min))); }

  function setValue(which, v){
    const s = chan[which];
    s.value = Math.max(s.min, Math.min(s.max, v));
    if(which==='A'){ 
      indA.style.transform=`translate(-50%,-100%) rotate(${valueToAngle(s.value,s.min,s.max)}deg)`; 
      hzInputA.value=s.value.toFixed(1); 
      if(oscA) oscA.frequency.value=s.value;
      updateFrequencyIndicator('A');
    }
    else { 
      indB.style.transform=`translate(-50%,-100%) rotate(${valueToAngle(s.value,s.min,s.max)}deg)`; 
      hzInputB.value=s.value.toFixed(1); 
      if(oscB) oscB.frequency.value=s.value;
      updateFrequencyIndicator('B');
    }
  }

  // Frequency Indicator Functions
  function updateFrequencyIndicator(channel) {
    const s = chan[channel];
    const freqBar = document.getElementById(`freqBar${channel}`);
    const freqMarker = document.getElementById(`freqMarker${channel}`);
    const freqDisplay = document.getElementById(`freqDisplay${channel}`);
    const freqHistory = document.getElementById(`freqHistory${channel}`);
    
    // Calculate position (logarithmic scale for better frequency distribution)
    const minLog = Math.log(s.min);
    const maxLog = Math.log(s.max);
    const valueLog = Math.log(s.value);
    const position = ((valueLog - minLog) / (maxLog - minLog)) * 100;
    
    // Update marker position and color
    const therapeuticColor = getTherapeuticColor(s.value);
    freqMarker.style.left = `${Math.max(0, Math.min(100, position))}%`;
    freqMarker.style.background = therapeuticColor;
    freqMarker.style.boxShadow = `0 0 12px ${therapeuticColor}`;
    
    // Update frequency display
    freqDisplay.textContent = `${s.value.toFixed(1)} Hz`;
    
    // Update bar color based on current frequency
    updateFrequencyBarColor(channel, s.value);
    
    // Add frequency trail effect
    addFrequencyTrail(freqHistory, position, channel);
    
    // Update scale labels
    updateFrequencyScale(channel);
  }
  
  function addFrequencyTrail(historyContainer, position, channel) {
    // Get current therapeutic color
    const therapeuticColor = getTherapeuticColor(chan[channel].value);
    
    // Create trail element
    const trail = document.createElement('div');
    trail.className = 'freq-trail';
    trail.style.left = `${position}%`;
    trail.style.background = `rgba(${hexToRgb(therapeuticColor)}, 0.5)`;
    historyContainer.appendChild(trail);
    
    // Remove trail after animation
    setTimeout(() => {
      if (trail.parentNode) {
        trail.parentNode.removeChild(trail);
      }
    }, 2000);
    
    // Limit number of trails
    const trails = historyContainer.children;
    if (trails.length > 10) {
      historyContainer.removeChild(trails[0]);
    }
  }
  
  function updateFrequencyScale(channel) {
    const s = chan[channel];
    const center = Math.sqrt(s.min * s.max); // Geometric mean for logarithmic scale
    
    document.getElementById(`freqScaleMin${channel}`).textContent = s.min;
    document.getElementById(`freqScaleCenter${channel}`).textContent = center.toFixed(0);
    document.getElementById(`freqScaleMax${channel}`).textContent = s.max;
  }
  
  // Interactive frequency bar with smooth dragging
  function setupFrequencyBarInteraction(channel) {
    const freqBar = document.getElementById(`freqBar${channel}`);
    let isDragging = false;
    
    function updateFrequencyFromPosition(e) {
      const rect = freqBar.getBoundingClientRect();
      const clickPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      
      // Convert position to frequency (logarithmic)
      const s = chan[channel];
      const minLog = Math.log(s.min);
      const maxLog = Math.log(s.max);
      const newFreq = Math.exp(minLog + clickPosition * (maxLog - minLog));
      
      setValue(channel, newFreq);
      updateFrequencyBarColor(channel, newFreq);
    }
    
    // Mouse events for smooth dragging
    freqBar.onmousedown = (e) => {
      isDragging = true;
      freqBar.style.cursor = 'grabbing';
      updateFrequencyFromPosition(e);
      e.preventDefault();
    };
    
    document.onmousemove = (e) => {
      if (isDragging) {
        updateFrequencyFromPosition(e);
      }
    };
    
    document.onmouseup = () => {
      if (isDragging) {
        isDragging = false;
        freqBar.style.cursor = 'pointer';
      }
    };
    
    // Touch events for mobile support
    freqBar.ontouchstart = (e) => {
      isDragging = true;
      const touch = e.touches[0];
      updateFrequencyFromPosition(touch);
      e.preventDefault();
    };
    
    document.ontouchmove = (e) => {
      if (isDragging && e.touches[0]) {
        updateFrequencyFromPosition(e.touches[0]);
        e.preventDefault();
      }
    };
    
    document.ontouchend = () => {
      isDragging = false;
    };
  }
  
  // Update frequency bar color based on therapeutic frequency ranges
  function updateFrequencyBarColor(channel, frequency) {
    const freqBar = document.getElementById(`freqBar${channel}`);
    const therapeuticColor = getTherapeuticColor(frequency);
    
    // Create gradient based on therapeutic color
    const darkColor = adjustColor(therapeuticColor, -30); // Darker version
    const lightColor = adjustColor(therapeuticColor, 15);  // Lighter version
    
    // Apply gradient background
    freqBar.style.background = `linear-gradient(90deg, ${darkColor} 0%, ${therapeuticColor} 50%, ${lightColor} 100%)`;
    freqBar.style.boxShadow = `inset 0 0 15px rgba(${hexToRgb(therapeuticColor)}, 0.2), 0 0 8px rgba(${hexToRgb(therapeuticColor)}, 0.15)`;
  }
  
  // Get therapeutic color based on frequency range
  function getTherapeuticColor(frequency) {
    // Therapeutic frequency color mapping - calming and relaxing colors
    if (frequency < 10) {
      // Very low frequencies - deep calming purple/indigo
      return interpolateColor('#2D1B69', '#4A148C', Math.min(frequency / 10, 1));
    } else if (frequency < 40) {
      // Delta/Theta waves - deep blue to soft purple (sleep/meditation)
      return interpolateColor('#1565C0', '#5E35B1', (frequency - 10) / 30);
    } else if (frequency < 100) {
      // Alpha waves - calming blue to soft teal (relaxation)
      return interpolateColor('#1976D2', '#00838F', (frequency - 40) / 60);
    } else if (frequency < 300) {
      // Low frequencies - soft teal to gentle green (grounding)
      return interpolateColor('#00ACC1', '#43A047', (frequency - 100) / 200);
    } else if (frequency < 600) {
      // Mid frequencies - gentle green to soft amber (balance)
      return interpolateColor('#66BB6A', '#FFB74D', (frequency - 300) / 300);
    } else if (frequency < 1000) {
      // Higher frequencies - soft amber to warm peach (focus)
      return interpolateColor('#FFB74D', '#FF8A65', (frequency - 600) / 400);
    } else {
      // Very high frequencies - warm peach to soft coral (awareness)
      const ratio = Math.min((frequency - 1000) / 2000, 1);
      return interpolateColor('#FF8A65', '#F06292', ratio);
    }
  }
  
  // Interpolate between two hex colors
  function interpolateColor(color1, color2, ratio) {
    ratio = Math.max(0, Math.min(1, ratio)); // Clamp ratio between 0 and 1
    
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  // Helper function to adjust color brightness
  function adjustColor(hexColor, percent) {
    const num = parseInt(hexColor.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }
  
  // Helper function to convert hex to RGB values
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '25, 211, 197'; // fallback to accent color
  }

  function wireKnob(knobEl, which){
    let dragging=false; knobEl.onpointerdown=e=>{dragging=true;knobEl.setPointerCapture(e.pointerId)}; knobEl.onpointerup=()=>dragging=false;
    knobEl.onpointermove=e=>{ if(!dragging) return; const s=chan[which]; const r=knobEl.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2; const ang=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90; const clamped=Math.max(-135,Math.min(135,ang)); setValue(which, angleToValue(clamped, s.min, s.max)); };
  }
  wireKnob(knobA,'A'); wireKnob(knobB,'B');

  // Enhanced Audio graph with effects chains
  let actx, oscA, oscB, gNodeA, gNodeB, pannerA, pannerB, master, analyserA, analyserB, masterAnalyser;
  let effectsA = {}, effectsB = {};
  function ensureAudio(){
    if(!actx){
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
      
      // Setup basic effects chains
      setupBasicEffects();
      
      // Connect with effects chains and stereo separation
      oscA.connect(gNodeA); oscB.connect(gNodeB);
      
      // Route through effects chains
      if (effectsA.input && effectsA.output) {
        gNodeA.connect(effectsA.input);
        effectsA.output.connect(analyserA);
        effectsA.output.connect(pannerA);
      } else {
        gNodeA.connect(analyserA);
        gNodeA.connect(pannerA);
      }
      
      if (effectsB.input && effectsB.output) {
        gNodeB.connect(effectsB.input);
        effectsB.output.connect(analyserB);
        effectsB.output.connect(pannerB);
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
    }
  }

  // Setup basic effects chains
  function setupBasicEffects() {
    try {
      // Effects for Channel A
      effectsA.input = actx.createGain();
      effectsA.filter = actx.createBiquadFilter();
      effectsA.delay = actx.createDelay(1.0);
      effectsA.delayGain = actx.createGain();
      effectsA.delayFeedback = actx.createGain();
      effectsA.reverbGain = actx.createGain();
      effectsA.chorusGain = actx.createGain();
      effectsA.output = actx.createGain();
      
      // Set default values
      effectsA.filter.type = 'allpass';
      effectsA.filter.frequency.value = 2000;
      effectsA.delay.delayTime.value = 0.25;
      effectsA.delayGain.gain.value = 0;
      effectsA.delayFeedback.gain.value = 0.3;
      effectsA.reverbGain.gain.value = 0;
      effectsA.chorusGain.gain.value = 0;
      
      // Connect effects chain A
      effectsA.input.connect(effectsA.filter);
      effectsA.filter.connect(effectsA.delay);
      effectsA.delay.connect(effectsA.delayGain);
      effectsA.delay.connect(effectsA.delayFeedback);
      effectsA.delayFeedback.connect(effectsA.delay);
      
      // Mix to output
      effectsA.filter.connect(effectsA.output); // Dry signal
      effectsA.delayGain.connect(effectsA.output); // Delay signal
      
      // Effects for Channel B (same setup)
      effectsB.input = actx.createGain();
      effectsB.filter = actx.createBiquadFilter();
      effectsB.delay = actx.createDelay(1.0);
      effectsB.delayGain = actx.createGain();
      effectsB.delayFeedback = actx.createGain();
      effectsB.reverbGain = actx.createGain();
      effectsB.chorusGain = actx.createGain();
      effectsB.output = actx.createGain();
      
      // Set default values
      effectsB.filter.type = 'allpass';
      effectsB.filter.frequency.value = 2000;
      effectsB.delay.delayTime.value = 0.25;
      effectsB.delayGain.gain.value = 0;
      effectsB.delayFeedback.gain.value = 0.3;
      effectsB.reverbGain.gain.value = 0;
      effectsB.chorusGain.gain.value = 0;
      
      // Connect effects chain B
      effectsB.input.connect(effectsB.filter);
      effectsB.filter.connect(effectsB.delay);
      effectsB.delay.connect(effectsB.delayGain);
      effectsB.delay.connect(effectsB.delayFeedback);
      effectsB.delayFeedback.connect(effectsB.delay);
      
      // Mix to output
      effectsB.filter.connect(effectsB.output); // Dry signal
      effectsB.delayGain.connect(effectsB.output); // Delay signal
      
    } catch (e) {
      console.warn('Effects setup failed:', e);
      // Fallback: direct connection
      effectsA = { input: null, output: null };
      effectsB = { input: null, output: null };
    }
  }

  // Play/Stop/Mute buttons
  document.getElementById('playA').onclick=()=>{ ensureAudio(); gNodeA.gain.linearRampToValueAtTime(chan.A.gain, actx.currentTime+0.05); };
  document.getElementById('stopA').onclick=()=>{ if(gNodeA) gNodeA.gain.linearRampToValueAtTime(0.0001, actx.currentTime+0.05); };
  document.getElementById('muteA').onclick=()=>{ chan.A.muted=!chan.A.muted; if(gNodeA) gNodeA.gain.value = chan.A.muted? 0.0001 : chan.A.gain; };

  document.getElementById('playB').onclick=()=>{ ensureAudio(); gNodeB.gain.linearRampToValueAtTime(chan.B.gain, actx.currentTime+0.05); };
  document.getElementById('stopB').onclick=()=>{ if(gNodeB) gNodeB.gain.linearRampToValueAtTime(0.0001, actx.currentTime+0.05); };
  document.getElementById('muteB').onclick=()=>{ chan.B.muted=!chan.B.muted; if(gNodeB) gNodeB.gain.value = chan.B.muted? 0.0001 : chan.B.gain; };

  // Hz input handlers
  hzInputA.oninput=()=>{ setValue('A', +hzInputA.value); };
  hzInputB.oninput=()=>{ setValue('B', +hzInputB.value); };

  // Sliders
  minA.oninput=()=>{ chan.A.min=+minA.value; minAVal.textContent=minA.value; setValue('A', chan.A.value); updateFrequencyScale('A'); };
  maxA.oninput=()=>{ chan.A.max=+maxA.value; maxAVal.textContent=maxA.value; setValue('A', chan.A.value); updateFrequencyScale('A'); };
  gA.oninput=()=>{ chan.A.gain=+gA.value/100; gainAVal.textContent=gA.value+'%'; if(gNodeA && !chan.A.muted) gNodeA.gain.value=chan.A.gain; };

  minB.oninput=()=>{ chan.B.min=+minB.value; minBVal.textContent=minB.value; setValue('B', chan.B.value); updateFrequencyScale('B'); };
  maxB.oninput=()=>{ chan.B.max=+maxB.value; maxBVal.textContent=maxB.value; setValue('B', chan.B.value); updateFrequencyScale('B'); };
  gB.oninput=()=>{ chan.B.gain=+gB.value/100; gainBVal.textContent=gB.value+'%'; if(gNodeB && !chan.B.muted) gNodeB.gain.value=chan.B.gain; };

  // Wave type controls
  document.getElementById('waveTypeA').onchange = (e) => {
    if (oscA) oscA.type = e.target.value;
  };
  
  document.getElementById('waveTypeB').onchange = (e) => {
    if (oscB) oscB.type = e.target.value;
  };

  // Master Controls
  let masterGainValue = 1.0;
  
  document.getElementById('masterPlay').onclick = () => {
    ensureAudio();
    document.getElementById('playA').click();
    document.getElementById('playB').click();
  };
  
  document.getElementById('masterStop').onclick = () => {
    document.getElementById('stopA').click();
    document.getElementById('stopB').click();
  };
  
  document.getElementById('masterGain').oninput = (e) => {
    masterGainValue = +e.target.value / 100;
    document.getElementById('masterGainVal').textContent = e.target.value + '%';
    if (master) {
      master.gain.value = masterGainValue;
    }
  };

  // Mapping selectors
  mapSelectA.onchange = () => {
    channelMaps.A = mapSelectA.value;
    buildChakraButtons('A');
  };
  
  mapSelectB.onchange = () => {
    channelMaps.B = mapSelectB.value;
    buildChakraButtons('B');
  };
  
  buildAllChakraButtons();

  // Audio Effects Controls
  
  // Effects toggle functionality
  document.getElementById('effectsToggleA').onclick = () => {
    const controls = document.getElementById('effectsControlsA');
    const button = document.getElementById('effectsToggleA');
    if (controls.classList.contains('show')) {
      controls.classList.remove('show');
      button.textContent = 'Show';
    } else {
      controls.classList.add('show');
      button.textContent = 'Hide';
    }
  };
  
  document.getElementById('effectsToggleB').onclick = () => {
    const controls = document.getElementById('effectsControlsB');
    const button = document.getElementById('effectsToggleB');
    if (controls.classList.contains('show')) {
      controls.classList.remove('show');
      button.textContent = 'Show';
    } else {
      controls.classList.add('show');
      button.textContent = 'Hide';
    }
  };

  // Effects control handlers for Channel A
  document.getElementById('reverbA').oninput = (e) => {
    document.getElementById('reverbAVal').textContent = e.target.value + '%';
    // Apply reverb effect (simplified for now)
    if (effectsA.reverbGain) {
      effectsA.reverbGain.gain.value = e.target.value / 100 * 0.5;
    }
  };
  
  document.getElementById('roomSizeA').oninput = (e) => {
    document.getElementById('roomSizeAVal').textContent = e.target.value + '%';
    // Room size affects reverb decay time
  };
  
  document.getElementById('delayA').oninput = (e) => {
    document.getElementById('delayAVal').textContent = e.target.value + '%';
    if (effectsA.delayGain) {
      effectsA.delayGain.gain.value = e.target.value / 100 * 0.3;
    }
  };
  
  document.getElementById('delayTimeA').oninput = (e) => {
    document.getElementById('delayTimeAVal').textContent = e.target.value + 'ms';
    if (effectsA.delay) {
      effectsA.delay.delayTime.value = e.target.value / 1000;
    }
  };
  
  document.getElementById('filterTypeA').onchange = (e) => {
    if (effectsA.filter) {
      effectsA.filter.type = e.target.value === 'none' ? 'allpass' : e.target.value;
    }
  };
  
  document.getElementById('filterFreqA').oninput = (e) => {
    document.getElementById('filterFreqAVal').textContent = e.target.value + 'Hz';
    if (effectsA.filter) {
      effectsA.filter.frequency.value = e.target.value;
    }
  };
  
  document.getElementById('chorusA').oninput = (e) => {
    document.getElementById('chorusAVal').textContent = e.target.value + '%';
    if (effectsA.chorusGain) {
      effectsA.chorusGain.gain.value = e.target.value / 100 * 0.3;
    }
  };
  
  document.getElementById('distortionA').oninput = (e) => {
    document.getElementById('distortionAVal').textContent = e.target.value + '%';
    // Apply distortion curve based on value
  };

  // Effects control handlers for Channel B (similar to A)
  document.getElementById('reverbB').oninput = (e) => {
    document.getElementById('reverbBVal').textContent = e.target.value + '%';
    if (effectsB.reverbGain) {
      effectsB.reverbGain.gain.value = e.target.value / 100 * 0.5;
    }
  };
  
  document.getElementById('roomSizeB').oninput = (e) => {
    document.getElementById('roomSizeBVal').textContent = e.target.value + '%';
  };
  
  document.getElementById('delayB').oninput = (e) => {
    document.getElementById('delayBVal').textContent = e.target.value + '%';
    if (effectsB.delayGain) {
      effectsB.delayGain.gain.value = e.target.value / 100 * 0.3;
    }
  };
  
  document.getElementById('delayTimeB').oninput = (e) => {
    document.getElementById('delayTimeBVal').textContent = e.target.value + 'ms';
    if (effectsB.delay) {
      effectsB.delay.delayTime.value = e.target.value / 1000;
    }
  };
  
  document.getElementById('filterTypeB').onchange = (e) => {
    if (effectsB.filter) {
      effectsB.filter.type = e.target.value === 'none' ? 'allpass' : e.target.value;
    }
  };
  
  document.getElementById('filterFreqB').oninput = (e) => {
    document.getElementById('filterFreqBVal').textContent = e.target.value + 'Hz';
    if (effectsB.filter) {
      effectsB.filter.frequency.value = e.target.value;
    }
  };
  
  document.getElementById('chorusB').oninput = (e) => {
    document.getElementById('chorusBVal').textContent = e.target.value + '%';
    if (effectsB.chorusGain) {
      effectsB.chorusGain.gain.value = e.target.value / 100 * 0.3;
    }
  };
  
  document.getElementById('distortionB').oninput = (e) => {
    document.getElementById('distortionBVal').textContent = e.target.value + '%';
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

  function nearestChakra(f, channel){
    const mapKey = channelMaps[channel];
    const set = MAPS[mapKey];
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
    if (!masterAnalyser || chan.A.muted || chan.B.muted) return { beatFreq: 0, amplitude: 0, modulation: 0 };
    
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
      
      const c = nearestChakra(chan.value, channelKey);
      const gCur = chan.muted ? 0 : chan.gain;
      const t = performance.now() / 1000;
      
      // Basic aura pulsing (always works)
      let pulse = 1 + 0.15 * gCur * Math.sin(t * chan.value * 0.02);
      
      // Try to get beat information for enhanced visualization (with error handling)
      try {
        const beatInfo = calculateBeatInfo();
        // Add beat frequency pulsing when both channels are active
        if (!chan.A.muted && !chan.B.muted && beatInfo.beatFreq > 0.1) {
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
    for (let tick = 16; tick <= 16384; tick *= 2) {
      if (tick < chan.min || tick > chan.max) continue;
      const y = view.height - (tick - chan.min) / (chan.max - chan.min) * view.height;
      ctx.fillRect(0, y, 8, 1);
      ctx.fillText(`${tick}`, 10, y + 3);
    }
    
    // Current frequency line
    const y = view.height - (chan.value - chan.min) / (chan.max - chan.min) * view.height;
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
    if (chan.muted) {
      hudText += ' (Muted)';
    }
    
    // Add beat frequency information when both channels are active (with error handling)
    try {
      const beatInfo = calculateBeatInfo();
      if (!chan.A.muted && !chan.B.muted && beatInfo.beatFreq > 0.1) {
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
      const c = nearestChakra(chan.value, channelKey);
      const gCur = chan.muted ? 0 : chan.gain;
      
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
      
      if (!chan.A.muted && !chan.B.muted && beatInfo.beatFreq > 0.1 && beatInfo.modulation > 0.05) {
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

  // Initialize frequency indicators
  setupFrequencyBarInteraction('A');
  setupFrequencyBarInteraction('B');
  
  // Set initial indicator positions
  setValue('A', chan.A.value); setValue('B', chan.B.value);
  updateFrequencyScale('A');
  updateFrequencyScale('B');
  draw();

  // Play/stop control buttons
  document.getElementById('playA').addEventListener('click', ensureAudio);
  document.getElementById('playB').addEventListener('click', ensureAudio);

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
          document.getElementById('stopA').click();
          document.getElementById('stopB').click();
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
  
  document.getElementById('applyBrainwave').onclick = () => {
    const selected = document.getElementById('brainwaveSelect').value;
    if (selected && brainwavePresets[selected]) {
      const preset = brainwavePresets[selected];
      setValue('A', preset.base);
      setValue('B', preset.base + preset.beat);
      document.getElementById('beatInfo').textContent = preset.info;
    }
  };

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
      document.getElementById('freqInfo').textContent = frequencyPresets[selected].info;
    } else {
      document.getElementById('freqInfo').textContent = 'Choose a frequency to learn about its properties and applications';
    }
  };
  
  document.getElementById('applyToA').onclick = () => {
    if (selectedFreqPreset && frequencyPresets[selectedFreqPreset]) {
      setValue('A', frequencyPresets[selectedFreqPreset].freq);
    }
  };
  
  document.getElementById('applyToB').onclick = () => {
    if (selectedFreqPreset && frequencyPresets[selectedFreqPreset]) {
      setValue('B', frequencyPresets[selectedFreqPreset].freq);
    }
  };
  
  document.getElementById('applyToBoth').onclick = () => {
    if (selectedFreqPreset && frequencyPresets[selectedFreqPreset]) {
      const freq = frequencyPresets[selectedFreqPreset].freq;
      setValue('A', freq);
      setValue('B', freq);
    }
  };

})();
