const SECOND = 1000;
const MINUTE = 60000;
const addresses = [
  // MAR 5 ADDITIONS
  {
    url: 'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/code-fuzzer.jpg',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  {
    url: 'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/llvm-art.jpg',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // FEB 21 ADDITIONS
  // scribbly line
  {
    url: 'https://media.giphy.com/media/fUKy3SJq7Abew/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // butterfly chart
  {
    url: 'https://media.giphy.com/media/zKfbzrVMFIMGA/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // vision test
  {
    url: 'https://media.giphy.com/media/FqejyJeGTXWIo/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // knights tour
  {
    url: 'https://media.giphy.com/media/Qn2FghdQQXhgQ/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // stuffed picturer
  {
    url: 'https://media.giphy.com/media/SjzPQjFD6yu9G/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // hello this is dog
  {
    url: 'https://media.giphy.com/media/pSpmpxFxFwDpC/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // reasons to go to the sea
  {
    url: 'https://media.giphy.com/media/g7lZQp9qN6JJ6/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // cvs receipt
  {
    url: 'https://media.giphy.com/media/PL2LZxMviOCly/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // trip to moon
  {
    url: 'https://media.giphy.com/media/XADqhTKtqg06c/giphy.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },

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
  {
    url: 'https://media3.giphy.com/media/l0MYITigF2CBljitq/giphy.gif?cid=3640f6095c622172427772702ef9baca',
    timeToDisplay: 0.2 * MINUTE,
    type: 'image'
  },
  {
    url: 'https://media3.giphy.com/media/d3mn0IJEfZ58EotW/giphy.gif?cid=3640f6095c6220dc6d68493045d5e8fe',
    timeToDisplay: 0.2 * MINUTE,
    type: 'image'
  },
  // {
  //   url: 'https://media0.giphy.com/media/E8wm3nfbNWBdC/giphy.gif?cid=3640f6095bf83d18503555496f65f413',
  //   timeToDisplay: 5.0 * MINUTE,
  //   type: 'image'
  // },
  {
    url: 'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/datavis-18-dear-data.png',
    timeToDisplay: 0.2 * MINUTE,
    type: 'image'
  },
  {
    url: 'https://github.com/uchicago-vis-pl-lab/vis-pl-lab/raw/master/assets/lighthouse-artifact.gif',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  },
  // {
  //   url: 'https://media2.giphy.com/media/l3vR980psm941tsQg/giphy.gif?cid=3640f6095bf83e2c786f4161777774c5',
  //   timeToDisplay: 0.5 * MINUTE,
  //   type: 'image'
  // },
  {
    url: 'https://uchicago-vis-pl-lab.github.io/default-screen-saver/',
    timeToDisplay: 0.5 * MINUTE,
    type: 'page'
  },
  {
    url: 'https://uchicago-cs.github.io/plrg/',
    timeToDisplay: 1 * MINUTE,
    type: 'page'
  },
  // {
  //   url: 'http://people.cs.uchicago.edu/~brianhempel/SVG%20Programming%20By%20Direct%20Manipulation%20of%20Intermediates%20De-anonymized%2048mb.mp4',
  //   timeToDisplay: 20 * MINUTE,
  //   type: 'video'
  // },
  {
    url: 'https://media1.giphy.com/media/t45sGfSonLg7m/giphy.gif?cid=3640f6095bf83d36506e786d6b8f9c28',
    timeToDisplay: 0.5 * MINUTE,
    type: 'image'
  }
];

const pagesToCheckBase = [
  'index.html',
  'main.css',
  'main.js'
];
const checkIntervalSeconds = 30;
let lastVersion = '';
function refreshIfNeeded() {
  let thisVersion = new Blob();

  function checkPages(pagesToCheck) {
    // head element
    const pageToCheck = pagesToCheck[0];
    // rest of list
    pagesToCheck = pagesToCheck.slice(1);

    fetch(pageToCheck).then(response => {
      if (response.ok) {
        return response.text();
      }
    }).then(pageText => {
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
