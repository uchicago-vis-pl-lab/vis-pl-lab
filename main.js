const SECOND = 1000;
const MINUTE = 60000;
const addresses = [
  // Example Video
  // {
  //   url: 'https://github.com/mediaelement/mediaelement-files/blob/master/big_buck_bunny.mp4?raw=true',
  //   timeToDisplay: 0.2 * MINUTE,
  //   type: 'video'
  // },
  // {
  //   url: 'https://maps.darksky.net/@temperature,41.574,-87.832,7',
  //   timeToDisplay: 0.3 * MINUTE,
  //   type: 'page'
  // },
  // {
  //   url: 'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/datavis-18-dear-data.png',
  //   timeToDisplay: 0.2 * MINUTE,
  //   type: 'image'
  // },
  // {
  //   url: 'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/lighthouse-artifact.gif',
  //   timeToDisplay: 0.2 * MINUTE,
  //   type: 'image'
  // },
  {
    url: 'https://uchicago-vis-pl-lab.github.io/default-screen-saver/',
    timeToDisplay: 0.5 * MINUTE,
    type: 'page'
  },
  // {
  //   url: 'https://uchicago-cs.github.io/plrg/',
  //   timeToDisplay: 1 * MINUTE,
  //   type: 'page'
  // },
  // {
  //   url: 'http://people.cs.uchicago.edu/~brianhempel/SVG%20Programming%20By%20Direct%20Manipulation%20of%20Intermediates%20De-anonymized%2048mb.mp4',
  //   timeToDisplay: 20 * MINUTE,
  //   type: 'video'
  // },

  {
    url: 'https://media.giphy.com/media/AxVvk1STKwGGGOU0GQ/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  {
    url: 'https://66.media.tumblr.com/f442c59ed011a67761d0feb3044a33da/tumblr_nf7rahcJvm1ru5h8co1_500.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  {
    url: 'https://media.giphy.com/media/3oriNOxhZpQB1511eM/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
];

const pagesToCheck = [
  'index.html',
  'main.css',
  'main.js'
];
const checkIntervalSeconds = 30;

lastVersion = "";

function refreshIfNeeded() {
  var thisVersion = new Blob();

  var checkPages = function(pagesToCheck) {
    var pageToCheck = pagesToCheck[0]; // head element
    pagesToCheck = pagesToCheck.slice(1); // rest of list

    fetch(pageToCheck).then(function(response) {
      if (response.ok) { return response.text(); }
    }).then(function(pageText) {
      thisVersion += pageText;
      if (pagesToCheck.length > 0) {
        checkPages(pagesToCheck);
      } else {
        // console.log(thisVersion);
        if (window.lastVersion.length == 0) {
          window.lastVersion = thisVersion;
        } else if (window.lastVersion !== thisVersion) {
          // console.log(window.lastVersion);
          // console.log(thisVersion);
          window.location.reload(true);
        }
        window.setTimeout(refreshIfNeeded, checkIntervalSeconds * SECOND);
      }
    })
  }

  checkPages(pagesToCheck);
}
refreshIfNeeded(); // Load up the initial version to compare against.

let idx = 0;
function setPage() {
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
    picHolder.setAttribute('style', `background-image:url(${nextAddress.url})`);
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

  setTimeout(() => {
    idx = (idx + 1) % addresses.length;
    setPage();
  }, nextAddress.timeToDisplay);
}
setPage();
