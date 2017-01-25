/* @flow */

import { assert } from 'chai';

import paypal from 'src/index';
import { config } from 'src/config';

import { onHashChange, uniqueID, generateECToken, CHILD_REDIRECT_URI, createElement,
         createTestContainer, destroyTestContainer } from '../common';


for (let flow of [ 'popup', 'lightbox' ]) {

    describe(`paypal legacy standalone checkout on ${flow}`, () => {

        beforeEach(() => {
            createTestContainer();
            paypal.Checkout.contexts.lightbox = (flow === 'lightbox');
        });

        afterEach(() => {
            destroyTestContainer();
            window.location.hash = '';
            paypal.Checkout.contexts.lightbox = false;
        });

        it('should call startFlow', () => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });
            let token = generateECToken();

            testButton.addEventListener('click', (event : Event) => {
                paypal.checkout.startFlow(token);
            });

            testButton.click();

            return onHashChange().then(urlHash => {
                assert.equal(urlHash, `#return?token=${token}&PayerID=YYYYYYYYYYYYY`);
            });
        });

        it('should call startFlow, with a cancel', () => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });
            let token = generateECToken();

            testButton.addEventListener('click', (event : Event) => {
                paypal.checkout.startFlow(token);
            });

            paypal.Checkout.props.testAction.def = () => 'cancel';

            testButton.click();

            return onHashChange().then(urlHash => {
                paypal.Checkout.props.testAction.def = () => 'checkout';
                assert.equal(urlHash, `#cancel?token=${token}`);
            });
        });

        it('should call startFlow with a url', () => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });
            let token = generateECToken();
            let hash = uniqueID();

            testButton.addEventListener('click', (event : Event) => {
                paypal.checkout.startFlow(`${config.checkoutUrl}&token=${token}#${hash}`);
            });

            testButton.click();

            return onHashChange().then(urlHash => {
                assert.equal(urlHash, `#return?token=${token}&PayerID=YYYYYYYYYYYYY&hash=${hash}`);
            });
        });

        it('should call startFlow with a url with no token', () => {

            let hash = uniqueID();

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });

            testButton.addEventListener('click', (event : Event) => {
                paypal.checkout.startFlow(`${CHILD_REDIRECT_URI}#${hash}`);
            });

            testButton.click();

            return onHashChange().then(urlHash => {
                assert.equal(urlHash, `#return?token=EC-XXXXXXXXXXXXXXXXX&PayerID=YYYYYYYYYYYYY&hash=${hash}`);
            });
        });

        it('should call initXO and then startFlow', () => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });
            let token = generateECToken();

            testButton.addEventListener('click', (event : Event) => {

                paypal.checkout.initXO();

                setTimeout(() => {
                    paypal.checkout.startFlow(token);
                }, 100);
            });

            testButton.click();

            return onHashChange().then(urlHash => {
                assert.equal(urlHash, `#return?token=${token}&PayerID=YYYYYYYYYYYYY`);
            });
        });

        it('should call initXO and then startFlow with a url', () => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });
            let token = generateECToken();
            let hash = uniqueID();

            testButton.addEventListener('click', (event : Event) => {
                paypal.checkout.initXO();

                setTimeout(() => {

                    paypal.checkout.startFlow(`${config.checkoutUrl}&token=${token}#${hash}`);
                }, 100);
            });

            testButton.click();

            return onHashChange().then(urlHash => {
                assert.equal(urlHash, `#return?token=${token}&PayerID=YYYYYYYYYYYYY&hash=${hash}`);
            });
        });

        it('should call initXO and then startFlow with a url with no token', () => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });

            let hash = uniqueID();

            testButton.addEventListener('click', (event : Event) => {
                paypal.checkout.initXO();

                setTimeout(() => {
                    paypal.checkout.startFlow(`${CHILD_REDIRECT_URI}#${hash}`);
                }, 100);
            });

            testButton.click();

            return onHashChange().then(urlHash => {
                assert.equal(urlHash, `#return?token=EC-XXXXXXXXXXXXXXXXX&PayerID=YYYYYYYYYYYYY&hash=${hash}`);
            });
        });

        it('should call initXO and immediately startFlow', () => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });
            let token = generateECToken();

            testButton.addEventListener('click', (event : Event) => {

                paypal.checkout.initXO();
                paypal.checkout.startFlow(token);
            });

            testButton.click();

            return onHashChange().then(urlHash => {
                assert.equal(urlHash, `#return?token=${token}&PayerID=YYYYYYYYYYYYY`);
            });
        });

        it('should call initXO and then closeFlow', (done) => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });

            testButton.addEventListener('click', (event : Event) => {

                if (flow === 'popup') {
                    let open = window.open;
                    window.open = function() : window {
                        window.open = open;

                        let win = window.open.apply(this, arguments);

                        let close = win.close;
                        win.close = function() : void {
                            let result = close.apply(this, arguments);
                            done();
                            return result;
                        };

                        return win;
                    };
                }

                paypal.checkout.initXO();

                setTimeout(() => {
                    paypal.checkout.closeFlow();

                    if (flow === 'lightbox') {
                        if (paypal.checkout.win.closed) {
                            return done();
                        } else {
                            return done(new Error('Expected lightbox to be closed'));
                        }
                    }
                }, 100);
            });

            testButton.click();
        });

        it('should call initXO and then closeFlow with a url', () => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });

            testButton.addEventListener('click', (event : Event) => {
                paypal.checkout.initXO();

                setTimeout(() => {
                    paypal.checkout.closeFlow('#closeFlowUrl');
                }, 100);
            });

            testButton.click();

            return onHashChange().then(urlHash => {
                assert.equal(urlHash, `#closeFlowUrl`);
            });
        });

        it('should call initXO and then closeFlow immediately', (done) => {

            let testButton = createElement({ tag: 'button', id: 'testButton', container: 'testContainer' });

            testButton.addEventListener('click', (event : Event) => {

                if (flow === 'lightbox') {
                    setTimeout(() => {
                        if (paypal.checkout.win.closed) {
                            return done();
                        } else {
                            return done(new Error('Expected lightbox to be closed'));
                        }
                    });

                } else {

                    let open = window.open;
                    window.open = function() : window {
                        window.open = open;

                        return {
                            close() {
                                done();
                            }
                        };
                    };
                }

                paypal.checkout.initXO();
                paypal.checkout.closeFlow();
            });

            testButton.click();
        });
    });
}
