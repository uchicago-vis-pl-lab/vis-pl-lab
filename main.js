/* eslint-disable no-unused-vars */
const SECOND = 1000;
const MINUTE = 60000;

// WANT TO ADD SOMETHING NEW?
// FIND A SIMILAR ITEM, video/page/image, COPY IT. DOESN"T MATTER WHERE IT GOES.
// INSERT IT AS APPROPRIATE INTO THE ADDRESSES ARRAY BELOW

const VIS_READING_GROUP_POSTER = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/vis-reading-group-poster.png',
  timeToDisplay: 0.75 * MINUTE,
  type: 'image'
};

const FORUM_EXPLORER = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/forum-explorer-ff-short.mp4',
  timeToDisplay: SECOND * 31,
  type: 'video'
};

const WEATHER_CHANNEL_AD = {
  url: 'https://www.youtube.com/embed/X05DrscHFZQ?rel=0;&autoplay=1&mute=1',
  timeToDisplay: 7 * MINUTE + 20 * SECOND,
  type: 'page'
};

const BUFFALO = {
  url: 'https://www.youtube.com/embed/8oGcbN3Me7Y?rel=0;&autoplay=1&mute=1',
  timeToDisplay: 2 * MINUTE,
  type: 'page'
};

const BUFFALO_2 = {
  url: 'https://www.youtube.com/embed/AExIcMII33o?rel=0;&autoplay=1&mute=1',
  timeToDisplay: 1.0 * MINUTE,
  type: 'page'
};

const RANDOM_OFFSET = Math.floor(Math.random() * 21000);
const BAD_GOVERNMENT = {
  url: `https://www.youtube.com/embed/kY9P7ruzOy4?rel=0;&autoplay=1&mute=1&start=${RANDOM_OFFSET}`,
  timeToDisplay: 1.0 * MINUTE,
  type: 'page'
};


function prepYouTube({link, time}) {
  return {
    url: `https://www.youtube.com/embed/${link}?rel=0;&autoplay=1&mute=1`,
    timeToDisplay: time,
    type: 'page'
  };
}

const TRAIN_LINES = [
  {link: 'VdFD2hy7kFM', time: 8.0 * MINUTE, color: 'JAPAN'},
  {link: 'PPbTYFAFAic', time: 8.0 * MINUTE, color: 'CALIFORNIA'},
  // {link: 'm9geCp5I0Ho', time: MINUTE * 16 + SECOND * 49, color: 'purple'},
  {link: '6bU5n93Jp1k', time: MINUTE * 11 + SECOND * 28, color: 'brown'}
  // {link: 'RHTUDwud5Ag', time: MINUTE * 13 + SECOND * 22, color: 'blue'},
  // {link: 'YygD5TDWbBI', time: MINUTE * 3 + SECOND * 50, color: 'yellow'},
  // {link: 'Wseu1CTuxrs', time: MINUTE * 10, color: 'red'}
]
  .map(prepYouTube)
  .filter(() => Math.random() > 0.5);

const AIR_LINE_SAFTY_VIDEOS = [
  {link: 'VTU8hdMb8hE', time: MINUTE * 3 + SECOND * 11}
].map(prepYouTube);


const BALLOONS = prepYouTube({link: 'ENUibJRdlkk', time: MINUTE * 2 + 10 * SECOND});

const DEIDEROT_PARTICLES = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/particles.m4v',
  timeToDisplay: SECOND * 16,
  type: 'video'
};

const JELLY_FISH = {
  url: 'https://www.youtube.com/embed/vYvwnTEYRsc?rel=0;&autoplay=1&mute=1',
  timeToDisplay: 2 * MINUTE,
  type: 'page'
};
const BEARS = {
  // note: the stuff after the ? enables the live-stream
  url: 'https://www.youtube.com/embed/qWlU7hWEl8c?rel=0;&autoplay=1&mute=1',
  timeToDisplay: 2 * MINUTE,
  type: 'page'
};

// CAT PICS?
const CAT_DRINKING_WATER = {
  url: 'http://tormenta.cs.uchicago.edu/files/drinking_water.mp4',
  timeToDisplay: MINUTE + 10 * SECOND,
  type: 'video'
};
const CODE_FUZZER = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/code-fuzzer.jpg',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const LLVM_ART = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/llvm-art.jpg',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const GOETHE = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/goethe-decandolle.png',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const KNIGHTS_TOUR = {
  url: 'https://media.giphy.com/media/Qn2FghdQQXhgQ/giphy.gif',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};

const BUTTERFLY_CHART = {
  url: 'https://media.giphy.com/media/zKfbzrVMFIMGA/giphy.gif',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const LIVE_WEATHER = {
  url:
    'https://maps.darksky.net/@apparent_temperature,44.152,-87.824,2901696?3d',
  timeToDisplay: 1.5 * MINUTE,
  type: 'page'
};

const FIRE_PLACE = {
  url:
    'https://media0.giphy.com/media/E8wm3nfbNWBdC/giphy.gif?cid=3640f6095bf83d18503555496f65f413',
  timeToDisplay: 5.0 * MINUTE,
  type: 'image'
};

const POTATOE = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/potatoe.png',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};

const DEAR_DATA = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/datavis-18-dear-data-lo-fi.png',
  timeToDisplay: 0.2 * MINUTE,
  type: 'image'
};
const LIGHT_HOUSE_MAP = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/lighthouse-artifact.gif',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};

const TABLE_CARTOGRAM = {
  url: 'https://uchicago-vis-pl-lab.github.io/default-screen-saver/',
  timeToDisplay: 0.5 * MINUTE,
  type: 'page'
};

const PLRG_POSTER = {
  url: 'https://uchicago-cs.github.io/plrg/',
  timeToDisplay: 1 * MINUTE,
  type: 'page'
};
// sketch and sketch looong video
const LONG_SKETCH_AND_SKETCH = {
  url:
    'http://people.cs.uchicago.edu/~brianhempel/SVG%20Programming%20By%20Direct%20Manipulation%20of%20Intermediates%20De-anonymized%2048mb.mp4',
  timeToDisplay: 20 * MINUTE,
  type: 'video'
};
// sketch and sketch 4min video
const FOURMIN_SKETCH_AND_SKETCH = {
  url:
    'http://people.cs.uchicago.edu/~brianhempel/Semi-Automated_SVG_Programming_Interacting_with_Intermediates_4min_Silent_Subtitled.mp4',
  timeToDisplay: 4 * MINUTE + 11 * SECOND,
  type: 'video'
};

const TEO_SCI_VIS_1 = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/smoothing-demo.png',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const TEO_SCI_VIS_2 = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/lip-rendering.png',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const TEO_SCI_VIS_3 = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/iso-2019.png',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const TEO_SCI_VIS_4 = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/ridge-surface-2019.png',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const TEO_SCI_VIS_5 = {
  url:
    'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/streamlines-2019.png',
  timeToDisplay: 0.5 * MINUTE,
  type: 'image'
};
const addresses = [
  // LIVE STREAMS
  // JELLY_FISH,
  // BEARS,

  // MEMES OR PSUEDOMMEMES
  BAD_GOVERNMENT,
  BALLOONS,
  // BUFFALO_2,
  BUFFALO,
  LLVM_ART,
  // KNIGHTS_TOUR,
  // // BUTTERFLY_CHART,
  // FIRE_PLACE,
  // ...AIR_LINE_SAFTY_VIDEOS,
  ...TRAIN_LINES,
  // POTATOE,

  // WEATHER THINGS
  // LIVE_WEATHER,
  WEATHER_CHANNEL_AD,

  // CAT PICS?
  // CAT_DRINKING_WATER,
  CODE_FUZZER,

  // DATA VIS + PROJECTS
  // VIS_READING_GROUP_POSTER,
  // FORUM_EXPLORER,
  TABLE_CARTOGRAM,
  DEAR_DATA,
  LIGHT_HOUSE_MAP,
  GOETHE,

  // PLRG + PROJECTS
  // PLRG_POSTER,
  // LONG_SKETCH_AND_SKETCH,
  FOURMIN_SKETCH_AND_SKETCH,

  // SCI VIS THINGS
  TEO_SCI_VIS_1,
  TEO_SCI_VIS_2,
  TEO_SCI_VIS_3,
  TEO_SCI_VIS_4,
  TEO_SCI_VIS_5,
  DEIDEROT_PARTICLES
];

const pagesToCheckBase = ['index.html', 'main.css', 'main.js'];
const checkIntervalSeconds = 30;
let lastVersion = '';
function refreshIfNeeded() {
  let thisVersion = new Blob();

  function checkPages(pagesToCheck) {
    // head element
    const pageToCheck = pagesToCheck[0];
    // rest of list
    pagesToCheck = pagesToCheck.slice(1);

    fetch(pageToCheck)
      .then(response => {
        if (response.ok) {
          return response.text();
        }
      })
      .then(pageText => {
        thisVersion += pageText;
        if (pagesToCheck.length > 0) {
          checkPages(pagesToCheck);
        } else {
          if (lastVersion.length === 0) {
            lastVersion = thisVersion;
          } else if (lastVersion !== thisVersion) {
            location.reload(true);
          }
          setTimeout(refreshIfNeeded, checkIntervalSeconds * SECOND);
        }
      });
  }

  checkPages(pagesToCheckBase);
}
// Load up the initial version to compare against.
refreshIfNeeded();

let idx = Math.floor(Math.random() * addresses.length);
const slider = document.getElementById('progress-bar-foreground');
function setPage() {
  // const nextAddress = addresses[Math.floor(Math.random() * addresses.length)];
  const nextAddress = addresses[idx];
  // preemptively deactivate everything
  const frame = document.getElementById('content-frame');
  const picHolder = document.getElementById('pic-holder');
  const videoHolder = document.getElementById('video-holder');
  frame.setAttribute('src', '');
  videoHolder.setAttribute('src', '');
  frame.setAttribute('class', 'hide-holder');
  picHolder.setAttribute('class', 'hide-holder');
  videoHolder.setAttribute('class', 'hide-holder');

  switch (nextAddress.type) {
    default:
    case 'image':
      picHolder.setAttribute('class', 'show-holder');
      picHolder.setAttribute(
        'style',
        `background-image:url(${nextAddress.url})`
      );
      break;
    case 'page':
      frame.setAttribute('class', 'show-holder');
      frame.setAttribute('src', nextAddress.url);
      break;
    case 'video':
      videoHolder.setAttribute('class', 'show-holder');
      videoHolder.setAttribute('src', nextAddress.url);
      break;
  }
  let percentDone = 0;
  const updateSpeed = SECOND * 0.5;
  const stepSize = (updateSpeed / nextAddress.timeToDisplay) * 100;
  const updater = setInterval(() => {
    percentDone += stepSize;
    slider.setAttribute('style', `left: ${percentDone}%;`);
  }, updateSpeed);
  setTimeout(() => {
    idx = (idx + 1) % addresses.length;
    clearInterval(updater);
    slider.setAttribute('style', 'left: 0;');
    setPage();
  }, nextAddress.timeToDisplay);
}
setPage();
