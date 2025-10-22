using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using SimpleJSON;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.SceneManagement;

namespace Zesty {
    public class API : MonoBehaviour {
        private static readonly int timeoutSeconds = 3;

        public static bool CheckAPIStatusSync() {
            using (UnityWebRequest request = UnityWebRequest.Get(Constants.BEACON_URL)) {
                DateTime dateTime = DateTime.UtcNow.AddSeconds(timeoutSeconds);

                request.SendWebRequest();

                while (!request.isDone && DateTime.UtcNow < dateTime);

                bool flag;

                if (isConnectionOrProtocolError(request) || DateTime.UtcNow >= dateTime) {
                    flag = false;
                } else {
                    flag = request.responseCode == 200;
                }

                return flag;
            }
        }

        /// <summary>
        /// Sends a PUT request using UnityWebRequest.
        /// </summary>
        /// <param name="url">The URL to PUT to.</param>
        /// <param name="body">The body of the message being sent.</param>
        /// <returns></returns>
        public static IEnumerator PutRequest(string url, string body)
        {
            var request = new UnityWebRequest(url, "PUT");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(body);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);

            yield return request.SendWebRequest();

            if (isConnectionOrProtocolError(request))
            {
                UnityEngine.Debug.Log($"PUT request error to {url}: {request.error}");
            }

            request.Dispose();
        }

        /// <summary>
        /// Sends a POST request using UnityWebRequest.
        /// </summary>
        /// <param name="url">The URL to POST to.</param>
        /// <param name="body">The body of the message being sent.</param>
        /// <param name="elmsKey">The keys to check for in the response object data.</param>
        /// <param name="callback">The callback function to send the processed response data to.</param>
        /// <returns></returns>
        public static IEnumerator PostRequest(string url, string body, string[] elmsKey, Action<Dictionary<string, string>> callback) {
            var request = new UnityWebRequest(url, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(body);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            if (isConnectionOrProtocolError(request))
            {
                UnityEngine.Debug.Log("POST request error: " + request.error);
            }
            else if (callback != null)
            {
                // Unused with current ad server architecture
            }

            request.Dispose();
        }

        /// <summary>
        /// Sends a GET request using UnityWebRequest.
        /// </summary>
        /// <param name="url">The URL to GET from.</param>
        /// <param name="callback">The callback function to send the processed response data to.</param>
        /// <returns></returns>
        public static IEnumerator GetRequest(string url, Action<BannerInfo> callback, string customDefaultImage = null, string customDefaultCTA = null)
        {
            if (string.IsNullOrEmpty(url))
            {
                UnityEngine.Debug.LogWarning("GetRequest: URL is null or empty");
                callback(null);
                yield break;
            }

            using (UnityWebRequest request = UnityWebRequest.Get(url))
            {
                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success || request.responseCode == 204)
                {
                    // No data retrieved, display default ad
                    List<Ad> fallbackAds = new List<Ad>
                    { 
                        new Ad()
                        {
                            asset_url = customDefaultImage ?? Formats.MediumRectangle.Images[0],
                            cta_url = customDefaultCTA ?? "relay.zesty.xyz"
                        } 
                    };
                    string fallbackCampaignId = "TestCampaign";
                    callback(new BannerInfo { Ads = fallbackAds, CampaignId = fallbackCampaignId });
                    yield break;
                }

                // Parse JSON response with error handling
                try
                {
                    UnityEngine.Debug.LogError(request.downloadHandler.text.Length);
                    var response = JSON.Parse(request.downloadHandler.text);
                    
                    // Validate response structure
                    if (response == null || response["Ads"] == null || response["CampaignId"] == null)
                    {
                        UnityEngine.Debug.LogError("GetRequest: Invalid response structure");
                        callback(null);
                        yield break;
                    }

                    BannerInfo bannerData = new BannerInfo();
                    List<Ad> ads = new List<Ad>();

                    // Parse ads array
                    for (int i = 0; i < response["Ads"].Count; i++)
                    {
                        var adNode = response["Ads"][i];
                        
                        // Validate each ad has required fields
                        if (adNode["asset_url"] == null || adNode["cta_url"] == null)
                        {
                            UnityEngine.Debug.LogWarning($"GetRequest: Ad at index {i} missing required fields, skipping");
                            continue;
                        }

                        Ad ad = new Ad
                        {
                            asset_url = adNode["asset_url"],
                            cta_url = adNode["cta_url"]
                        };
                        ads.Add(ad);
                    }

                    bannerData.Ads = ads;
                    bannerData.CampaignId = response["CampaignId"];
                    
                    callback(bannerData);
                }
                catch (Exception ex)
                {
                    UnityEngine.Debug.LogError($"GetRequest: Error parsing response: {ex.Message}");
                    callback(null);
                }
            }
        }

        /// <summary>
        /// Retrieves textures from the specified URL.
        /// </summary>
        /// <param name="url">The URL to retrieve the texture from.</param>
        /// <param name="callback">The callback function to send the retrieved texture to.</param>
        /// <returns></returns>
        public static IEnumerator GetTexture(string url, Action<Texture> callback) {
            UnityWebRequest request = UnityWebRequestTexture.GetTexture(url);

            yield return request.SendWebRequest();

            if (isConnectionOrProtocolError(request)) {
                UnityEngine.Debug.Log ("Texture GET request error: " + request.error);
            } else {
                Texture t = ((DownloadHandlerTexture)request.downloadHandler).texture;
                callback(t);
            }
        }

        /// <summary>
        /// Checks if the specified request experienced a connection or protocol error.
        /// </summary>
        /// <param name="request">The UnityWebRequest to check.</param>
        /// <returns>True if a connection or protocol error was experienced, else False.</returns>
        private static bool isConnectionOrProtocolError(UnityWebRequest request)
        {
#if UNITY_2020_1_OR_NEWER
            return request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError;
#else
            return request.isNetworkError || request.isHttpError;
#endif
        }

    }

}