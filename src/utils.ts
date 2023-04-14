import { window, workspace, Range } from 'coc.nvim';
import * as path from 'path';
import { IImgInfo } from 'picgo/dist/src/utils/interfaces';
import { IOutputUrl, IUploadName } from './picgo';

export function formatParam(file: string, mdFileName: string): IUploadName {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const d = dt.getDate();
  const h = dt.getHours();
  const mm = dt.getMinutes();
  const s = dt.getSeconds();

  let pad = function (x: number) {
    return ('00' + x).slice(-2);
  };

  const date = `${y}-${pad(m)}-${pad(d)}`;
  var extName = path.extname(file);

  return {
    date,
    dateTime: `${date}-${pad(h)}-${pad(mm)}-${pad(s)}`,
    fileName: path.basename(file, extName),
    extName,
    mdFileName,
  };
}

export function formatString(
  tplString: string,
  data: IUploadName | IOutputUrl,
) {
  const keys = Object.keys(data);
  const values = keys.map(k => data[k]);
  return new Function(keys.join(','), 'return `' + tplString + '`').apply(
    null,
    values,
  );
}

import nls = require('../package.nls.json');

function addPeriod(messgae: string) {
  if (!messgae.endsWith('.') && !messgae.endsWith('!')) {
    messgae = messgae + '.';
  }
  return messgae;
}

export function showWarning(messgae: string) {
  messgae = addPeriod(messgae);
  window.showInformationMessage(`${nls['ext.displayName']}: ${messgae}`);
}

export function showError(messgae: string) {
  messgae = addPeriod(messgae);
  window.showInformationMessage(`${nls['ext.displayName']}: ${messgae}`);
}

export function showInfo(messgae: string) {
  messgae = addPeriod(messgae);
  window.showInformationMessage(`${nls['ext.displayName']}: ${messgae}`);
}

/**
 * Return uploaded name accrding to `imgInfo.fileName`,
 * extname will be removed for the sake of simplicity when used as alt.
 * @param imgInfo
 */
export function getUploadedName(imgInfo: IImgInfo): string {
  let fullName: string;
  if (!imgInfo.fileName) {
    fullName = '';
  } else {
    fullName = imgInfo.fileName as string;
  }
  let basename = path.basename(fullName, path.extname(fullName));
  return basename;
}

export async function detectImgUrlRange(): Promise<Range|undefined> {
  const doc = await workspace.document
  const cursor = await window.getCursorPosition()
  const line = doc.getline(cursor.line)

  // ![txt](url "title")
  const link = new RegExp(
    /(!\[[^\[\]]*\]\()/.source // ![txt](
      + /([^\(\)"]*)/.source // url
      + /(?:\s*"[^"]*")?\)/.source // "title")
    , 'g');

  let matched = line.matchAll(link);
  for (const i of matched) {
    if (typeof i.index == "undefined") {
      break
    }

    if (cursor.character >= i.index && cursor.character <= i.index + i[0].length) {
      return Range.create(cursor.line, i.index + i[1].length,
        cursor.line, i.index + i[1].length + i[2].length)
    }
  }
}
