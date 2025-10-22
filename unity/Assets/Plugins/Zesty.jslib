mergeInto(LibraryManager.library, {
  _sendOnLoadMetric: async function (adUnitId, campaignId) {
    var adUnitString = UTF8ToString(adUnitId);
    var campaignIdString = UTF8ToString(campaignId);
    var userPlatform = await Module.Zesty.checkUserPlatform();
    var platform = userPlatform.platform;
    var confidence = userPlatform.confidence;
    var body = { query: `mutation { increment(eventType: visits, spaceId: "${adUnitString}", campaignId: \"${campaignIdString}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` };

    try {
      await fetch('https://beacon2.zesty.market/zgraphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (e) {
      console.log("Failed to emit onload event", e.message)
    }
  },
  _sendOnClickMetric: async function (adUnitId, campaignId) {
    var adUnitString = UTF8ToString(adUnitId);
    var campaignIdString = UTF8ToString(campaignId);
    var userPlatform = await Module.Zesty.checkUserPlatform();
    var platform = userPlatform.platform;
    var confidence = userPlatform.confidence;
    var body = { query: `mutation { increment(eventType: clicks, spaceId: "${adUnitString}", campaignId: \"${campaignIdString}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` };

    try {
      await fetch('https://beacon2.zesty.market/zgraphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (e) {
      console.log("Failed to emit onclick event", e.message)
    }
  },
  _open: function (url) {
    if (!url) return;

    var urlString = UTF8ToString(url);

    // Are we on a device that will deeplink?
    // This may need to be expanded in the future.
    if (Module.Zesty.checkOculusBrowser().match) {
      if (urlString.includes('https://www.oculus.com/experiences/quest/')) {
        setTimeout(() => {
          window.open(urlString, '_blank');
        }, 1000);
        return;
      }
    } else if (Module.Zesty.checkWolvicBrowser().match) {
      // Wolvic's pop-up blocking is more aggressive than other
      // Chromium-based XR browsers, probably due to its Firefox
      // lineage. In order to prevent clicks being caught by it,
      // construct our own modal window and directly link the
      // yes button to the window.open call.
      var modal = document.createElement('div');
      var content = document.createElement('div');
      var message = document.createElement('p');
      var yes = document.createElement('button');
      var no = document.createElement('button');

      modal.style.backgroundColor = 'rgb(0, 0, 0, 0.75)'
      modal.style.color = 'white';
      modal.style.textAlign = 'center';
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.padding = '5%';
      modal.style.borderRadius = '5%';
      modal.style.transform = 'translate(-50%, -50%)';

      message.innerHTML = `<b>This billboard leads to ${urlString}. Continue?</b>`;

      yes.innerText = 'Move cursor back into window.';
      yes.style.width = '100vw';
      yes.style.height = '100vh';
      yes.onmouseenter = () => {
        yes.style.width = 'auto';
        yes.style.height = 'auto';
        yes.innerText = 'Yes';
      }
      yes.onclick = () => {
        window.open(urlString, '_blank');
        modal.remove();
      }

      no.innerText = 'No';
      no.onclick = () => {
        modal.remove();
      }

      modal.append(content);
      content.append(message);
      content.append(yes);
      content.append(no);
      document.body.append(modal);
      return;
    }
    window.open(urlString, "_blank");
  },
  _initPrebid: function (adUnitId, format) {
    var idString = UTF8ToString(adUnitId);
    let formatString;

    Module['Zesty'].prebid.previousUrls[idString] = { asset_url: null, cta_url: null };

    switch (format) {
      case 0:
        formatString = 'mobile-phone-interstitial';
        break;
      case 1:
        formatString = 'billboard';
        break;
      case 2:
        formatString = 'medium-rectangle';
        break;
      default:
        formatString = 'medium-rectangle';
    }

    // Create div for prebid to target
    const div = document.createElement('div');
    div.id = 'zesty-div';
    div.style.height = '250px';
    div.style.width = '300px';
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.zIndex = '-2';
    document.body.appendChild(div);

    // Append google gpt tag
    const script = document.createElement('link');
    script.href = 'https://www.googletagservices.com/tag/js/gpt.js';
    script.rel = 'preload';
    script.as = 'script';
    document.head.appendChild(script);

    // Append aditude wrapper tag
    const aditudeScript = document.createElement('script');
    aditudeScript.src = 'https://dn0qt3r0xannq.cloudfront.net/zesty-ig89tpzq8N/zesty-longform/prebid-load.js';
    aditudeScript.async = true;
    document.head.appendChild(aditudeScript);

    // Load gifler script in case gif creative is served
    const gifscript = document.createElement('script');
    gifscript.src = 'https://cdn.jsdelivr.net/npm/gifler@0.1.0/gifler.min.js';
    document.head.appendChild(gifscript);

    // Select baseDivId based on format, defaulting to the one for medium rectangle
    if (formatString == 'medium-rectangle') {
      div.id = 'zesty-div-medium-rectangle';
    } else if (formatString == 'billboard') {
      Module['Zesty'].prebid.baseDivId = 'pb-slot-billboard';
      div.id = 'zesty-div-billboard';
      div.style.width = '728px';
      div.style.height = '90px';
    } else if (formatString == 'mobile-phone-interstitial') {
      Module['Zesty'].prebid.baseDivId = 'pb-slot-interstitial';
      div.id = 'zesty-div-mobile-phone-interstitial';
      div.style.width = '1080px';
      div.style.height = '1920px';
    }

    // Pass ad unit id as a custom param for prebid metrics
    window.Raven = window.Raven || { cmd: [] };
    window.Raven.cmd.push(({ config }) => {
      config.setCustom({
        param1: idString,
      });
    });

    window.tude = window.tude || { cmd: [] };
    tude.cmd.push(function() {
      tude.refreshAdsViaDivMappings([
        {
          divId: `zesty-div-${formatString}`,
          baseDivId: Module['Zesty'].prebid.baseDivId,
        }
      ]);
    });

    function getUrlsFromIframe(iframe) {
      if (!iframe.contentDocument) return;
  
      const images = iframe.contentDocument.querySelectorAll('img');
      const adImage = Array.prototype.filter.call(images, image => image.height > 1);
      if (adImage.length == 0) return;
      const asset_url = adImage[0].src;
      const cta_url = adImage[0].parentElement.href;
      return { asset_url, cta_url };
    }
    Module['Zesty'].prebid.interval = setInterval(() => {
        const div = document.getElementById(`zesty-div-${formatString}`);
        if (!div) return;

        const iframe = div.querySelector('iframe');
        if (iframe) {
            let urls = getUrlsFromIframe(iframe);
            if (urls) {
                if (urls.asset_url !== Module['Zesty'].prebid.previousUrls[idString].asset_url || urls.cta_url !== Module['Zesty'].prebid.previousUrls[idString].cta_url) {
                    Module['Zesty'].prebid.previousUrls[idString] = { asset_url: urls.asset_url, cta_url: urls.cta_url };
                    Module['Zesty'].prebid.bids = { asset_url: urls.asset_url, cta_url: urls.cta_url };
                }
            }
        }
    }, 1000);

    Module['Zesty'].prebid.prebidInit = true;
  },
  _tryGetWinningBidInfo: function () {
    if (Module['Zesty'].prebid.bids.asset_url && Module['Zesty'].prebid.bids.cta_url) {
      // Clear the interval and grab the image+url from the prebid ad
      const urls = Module['Zesty'].prebid.bids;
      if (urls.asset_url.startsWith('canvas://')) {
        const canvasIframe = document.createElement('iframe');
        canvasIframe.id = "zesty-canvas-iframe";
        document.body.appendChild(canvasIframe);
        canvasIframe.contentDocument.open();
        canvasIframe.contentDocument.write(asset_url.split('canvas://')[1]);
        canvasIframe.contentDocument.close();
      }
      const returnStr = `${urls.asset_url}|${urls.cta_url}|Prebid`;
      const bufferSize = lengthBytesUTF8(returnStr) + 1;
      const buffer = _malloc(bufferSize);
      stringToUTF8(returnStr, buffer, bufferSize);
      return buffer;
    } else {
      const returnStr = "";
      const bufferSize = lengthBytesUTF8(returnStr) + 1;
      const buffer = _malloc(bufferSize);
      stringToUTF8(returnStr, buffer, bufferSize);
      return buffer;
    }
  },
  _updateAdModal: function (adUnitIdRaw, campaignIdRaw, format, imageRaw, urlRaw, modalTriggerRaw, modalDelay) {
    const adUnitId = UTF8ToString(adUnitIdRaw);
    const campaignId = UTF8ToString(campaignIdRaw);
    const image = UTF8ToString(imageRaw);
    const url = UTF8ToString(urlRaw);
    const modalTrigger = UTF8ToString(modalTriggerRaw);

    // Hook up modal trigger
    const onModalTrigger = () => {
      let modal = Module['Zesty']._constructAdModal(adUnitId, campaignId, format, image, url, modalDelay);
      document.body.appendChild(modal);
    };
    document.removeEventListener(modalTrigger, onModalTrigger);
    document.addEventListener(modalTrigger, onModalTrigger);
  }
})