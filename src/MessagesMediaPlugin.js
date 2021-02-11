import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

import MessageImage from "./components/MessageImage/MessageImage";
import ImageModal from "./components/ImageModal/ImageModal";
import SendMedia from './components/SendMedia/SendMedia';

import reducers, { namespace } from './states';

const PLUGIN_NAME = 'MessagesMediaPlugin';

export default class MessagesMediaPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    this.registerReducers(manager);

    flex.Actions.registerAction("smsModalControl", (payload, abort) => {
      var event = new Event("smsModalControlOpen");
      event.url = payload.url;
      document.dispatchEvent(event);
      return new Promise((resolve, reject) => {
        resolve();
      });
    });

    flex.MessageBubble.Content.add(<MessageImage key="image" />);

    flex.MainContainer.Content.add(<ImageModal key="imageModal" />, {
      sortOrder: 1
    });

    flex.MessageInput.Content.add(<SendMedia key="sendMedia" manager={manager}/>);
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
