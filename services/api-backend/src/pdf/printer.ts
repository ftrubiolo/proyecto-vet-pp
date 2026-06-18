import path from 'path';
// @ts-ignore
import pdfMake from 'pdfmake';

const pdfmakePath = path.dirname(require.resolve('pdfmake'));
const fontPath = (fontName: string) => path.join(pdfmakePath, '../fonts/Roboto', fontName);

const fonts = {
    Roboto: {
        normal: fontPath('Roboto-Regular.ttf'),
        bold: fontPath('Roboto-Medium.ttf'),
        italics: fontPath('Roboto-Italic.ttf'),
        bolditalics: fontPath('Roboto-MediumItalic.ttf'),
    }
};

pdfMake.setFonts(fonts);

export default pdfMake;
