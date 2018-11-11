import _ from 'lodash';
import directory from '../directory';

// Some validation regexes and rules in this file are taken from Fonero Laboratory
// Do not take code out from this file into other files
// Fonero Laboratory is licensed under Apache 2.0
// https://github.com/fonero-project/laboratory

// First argument is always input

const RESULT_EMPTY = {
  ready: false,
};
const RESULT_VALID = {
  ready: true,
};

function resultError(errorMessage) {
  return {
    ready: false,
    message: errorMessage,
  };
}

const Validate = {
  assetCode(input) {
    return _.isString(input) && input.match(/^[a-zA-Z0-9]+$/g) && input.length > 0 && input.length < 12;
  },
  amount(input) {
    if (input === '') {
      return null;
    }
    const inputIsPositive = !!input.charAt(0) !== '-';
    const inputValidNumber = !!input.match(/^[0-9]*(\.[0-9]+){0,1}$/g);
    const inputPrecisionLessThan7 = !input.match(/\.([0-9]){8,}$/g);
    return inputIsPositive && inputValidNumber && inputPrecisionLessThan7;
  },

  // Below are the Validators using the new compound return types
  memo(input, type) {
    input = String(input);
    if (input === '') {
      return RESULT_EMPTY;
    }

    // type is of type: 'MEMO_ID' |'MEMO_TEXT' | 'MEMO_HASH' | 'MEMO_RETURN'
    switch (type) {
      case 'MEMO_ID':
        if (!input.match(/^[0-9]*$/g)) {
          return resultError('MEMO_ID only accepts a positive integer.');
        }
        if (input !== FoneroSdk.UnsignedHyper.fromString(input).toString()) {
          return resultError(`MEMO_ID is an unsigned 64-bit integer and the max valid
                       value is ${FoneroSdk.UnsignedHyper.MAX_UNSIGNED_VALUE.toString()}`);
        }
        break;
      case 'MEMO_TEXT':
        const memoTextBytes = Buffer.byteLength(input, 'utf8');
        if (memoTextBytes > 28) {
          return resultError(`MEMO_TEXT accepts a string of up to 28 bytes. ${memoTextBytes} bytes entered.`);
        }
        break;
      case 'MEMO_HASH':
      case 'MEMO_RETURN':
        if (!input.match(/^[0-9a-f]{64}$/gi)) {
          return resultError(`${type} accepts a 32-byte hash in hexadecimal format (64 characters).`);
        }
        break;
    }

    return RESULT_VALID;
  },
  address(input, type) {
    if (input === '') {
      return RESULT_EMPTY;
    }

    // Regex covers 99% of the use cases.
    // - Allows any character in user part except * and , as specified in Fonero docs
    // - Includes all valid addresses and a few invalid ones too such as fake TLD or misuse of hyphens or excessive length
    if (!input.match(/^[^\*\,]+\*([\-a-zA-Z0-9]+)?(\.[\-a-zA-Z0-9]+)*(\.[a-zA-Z0-9]{2,})$/)) {
      return resultError('Fonero federation address is improperly formatted.');
    }

    return RESULT_VALID;
  },
  publicKey(input) {
    if (input === '') {
      return RESULT_EMPTY;
    }
    if (!FoneroSdk.StrKey.isValidEd25519PublicKey(input)) {
      return resultError('Invalid public key');
    }
    return RESULT_VALID;
  },
};

export default Validate;
