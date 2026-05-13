import { Component, Property } from '@wonderlandengine/api';

/**
 * This component exposes the banners in the scene for testing purposes.
 */
export class ExposeBanners extends Component {
    static TypeName = 'expose-banners';
    static Properties = {
        banner1Object: Property.object(),
        banner2Object: Property.object(),
        banner3Object: Property.object(),
    };

    start() {
        this.banner1 = this.banner1Object.getComponent('borellion-banner');
        this.banner2 = this.banner2Object.getComponent('borellion-banner');
        this.banner3 = this.banner3Object.getComponent('borellion-banner');
        window.testBanners = [
            this.banner1,
            this.banner2,
            this.banner3,
        ]
    }
};
