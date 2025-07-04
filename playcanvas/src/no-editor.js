import { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, AD_REFRESH_INTERVAL, DEFAULT_CTA_URL, DEFAULT_CAMPAIGN_ID } from '../../utils/networking';
import { openURL, visibilityCheck } from '../../utils/helpers';
import * as pc from 'playcanvas';
import { formats } from '../../utils/formats';

/** @type {typeof import("playcanvas").ScriptType} */
const ZestyBanner = pc.createScript('zesty-banner');

ZestyBanner.attributes.add("adUnitId", { type: "string" });
ZestyBanner.attributes.add("format", {
    type: "number",
    enum: [
        { "Medium Rectangle": 1 },
        { "Billboard": 2 },
        { "Mobile Phone Interstitial": 3 },
    ],
    default: 1,
});
ZestyBanner.attributes.add("cameraEntity", { type: "entity" });
ZestyBanner.attributes.add("useActiveCamera", { type: "boolean", default: false });

const FORMATS = {
    1: "medium-rectangle",
    2: "billboard",
    3: "mobile-phone-interstitial",
}

// initialize code called once per entity
ZestyBanner.prototype.initialize = function() {
    this.ctaUrl = DEFAULT_CTA_URL;
    this.campaignId = DEFAULT_CAMPAIGN_ID;

    // Create banner entity and material
    this.bannerEntity = new pc.Entity();
    this.bannerMaterial = new pc.StandardMaterial();
    
    // Create banner texture
    setInterval(this.refreshIfVisible.bind(this), AD_REFRESH_INTERVAL);
    sendOnLoadMetric(this.adUnitId, this.campaignId);

    // Create banner entity and configure
    const width = formats[FORMATS[this.format]].width;
    const height = formats[FORMATS[this.format]].height;
    this.bannerEntity.addComponent("render", { type: "plane", material: this.bannerMaterial });
    this.bannerEntity.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(width / 2, 0.001, height / 2) });
    this.bannerEntity.setLocalScale(width, 1, height);

    // Click handling
    document.body.addEventListener('mousedown', this.onSelect.bind(this), false);
    this.on('destroy', function() {
        document.body.removeEventListener('mousedown', this.onSelect.bind(this), false);
    }, this);

    // VR handling
    this.app.xr.input.on('select', (inputSource) => {
        this.onSelect(null, inputSource).bind(this);
    });

    this.entity.addChild(this.bannerEntity);
};

ZestyBanner.prototype.loadBanner = async function() {
    const activeBanner = await fetchCampaignAd(this.adUnitId, FORMATS[this.format]);

    const { asset_url: image, cta_url: url } = activeBanner.Ads[0];

    return { image, url, campaignId: activeBanner.CampaignId };
}

ZestyBanner.prototype.refreshIfVisible = function() {
    /** @type {import("playcanvas").CameraComponent} */
    const camera = this.useActiveCamera ? this.app.scene._activeCamera : this.cameraEntity.camera;
    if (!camera) return;
    const cameraEntity = this.useActiveCamera ? this.app.scene._activeCamera.node : this.cameraEntity;

    const bb = new pc.BoundingBox();
    bb.copy(this.bannerEntity.render.meshInstances[0].aabb);
    const isVisible = visibilityCheck(
        bb.getMin().toArray(),
        bb.getMax().toArray(),
        camera.projectionMatrix.data,
        cameraEntity.getWorldTransform().data,
    );
    if (isVisible) {
        const self = this;
        self.loadBanner(self.adUnitId, FORMATS[self.format]).then(banner => {
          self.app.assets.loadFromUrl(banner.image, "texture", function(err, asset) {
                self.ctaUrl = banner.url;
                self.campaignId = banner.campaignId;
                const texture = asset._resources[0];
                self.bannerMaterial.diffuseMap = texture;
                self.bannerMaterial.opacityMap = texture;
                self.bannerMaterial.blendType = pc.BLEND_NORMAL;
                self.bannerMaterial.update();
            });
        });
    }
}

/**
 * 
 * @param {MouseEvent} e
 * @param {import("playcanvas").XrInputSource} inputSource
 */
ZestyBanner.prototype.onSelect = function(e, inputSource) {
    let from, to;
    if (inputSource) {
        from = inputSource.getOrigin();

        const direction = inputSource.getDirection().normalize();
        const rayLength = 1000;

        to = new pc.Vec3().copy(from).add(direction.mulScalar(rayLength));
    } else {
        const cameraEntity = this.useActiveCamera ? this.app.scene._activeCamera.node : this.cameraEntity;
        from = cameraEntity.camera.screenToWorld(e.x, e.y, cameraEntity.camera.nearClip);
        to = cameraEntity.camera.screenToWorld(e.x, e.y, cameraEntity.camera.farClip);
    }

    var result = this.app.systems.rigidbody.raycastFirst(from, to);
    if (result && result.entity == this.bannerEntity) {
        this.app.xr.end();
        sendOnClickMetric(this.adUnitId, this.campaignId);
        openURL(this.ctaUrl);
    }
}

export default ZestyBanner;