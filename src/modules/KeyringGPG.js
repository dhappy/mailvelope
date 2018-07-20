/**
 * Copyright (C) 2017 Mailvelope GmbH
 * Licensed under the GNU Affero General Public License version 3
 */

import mvelo from '../lib/lib-mvelo';
const l10n = mvelo.l10n.getMessage;
import KeyringBase from './KeyringBase';
import * as gnupg from './gnupg';

export default class KeyringGPG extends KeyringBase {
  getPgpBackend() {
    return gnupg;
  }

  /**
   * Import armored keys into the keyring
   * @param  {Object<armored: String, type: String>} armoredKeys - armored keys of type 'public' or 'private'
   * @return {Array<Object>} import result messages in the form {type, message}, type could be 'error' or 'success'
   */
  async importKeys(armoredKeys) {
    armoredKeys = armoredKeys.map(key => key.armored).join('\n');
    const importResult = await this.keystore.importKeys(armoredKeys);
    const importPromises = importResult.map(async imported => {
      if (imported.error) {
        console.log('Error on key import in GnuPG', imported.error);
        return {type: 'error', message: l10n(imported.key.secret ? 'key_import_private_read' : 'key_import_public_read', [imported.error.message])};
      }
      // import successful, remove existing keys with this fingerprint
      this.keystore.removeKeysForId(imported.key.fingerprint);
      this.keystore.addKey(imported.key.armor);
      // TODO: success message
    });
    return Promise.all(importPromises);
  }

  async removeKey(fingerprint, type) {
    await this.keystore.removeKey(fingerprint, type);
    super.removeKey(fingerprint, type);
  }
}
