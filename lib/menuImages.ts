import {getCloudflareContext} from '@opennextjs/cloudflare';

export type Bucket={
 put:(key:string,value:ArrayBuffer,opts?:{httpMetadata?:{contentType?:string}})=>Promise<unknown>;
 get:(key:string)=>Promise<{body:ReadableStream;httpMetadata?:{contentType?:string}}|null>;
};

// The R2 bucket bound as MENU_IMAGES in wrangler.jsonc. Null if it is not set up.
export function bucket():Bucket|null{
 try{return (getCloudflareContext().env as unknown as {MENU_IMAGES?:Bucket}).MENU_IMAGES??null}
 catch{return null}
}

// Trust the file's real bytes, not the name or the type the browser claims.
export function sniff(b:Uint8Array):string|null{
 if(b.length<12)return null;
 if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';
 if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return 'image/png';
 if(b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46&&b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50)return 'image/webp';
 return null;
}