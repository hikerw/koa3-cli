import SparkMD5 from 'spark-md5';

const CHUNK = 2 * 1024 * 1024;

/**
 * 浏览器端分片计算文件 MD5（小写 hex），适合大文件
 */
export function md5File(file) {
  if (!file || !(file instanceof Blob)) {
    return Promise.reject(new Error('无效文件'));
  }
  return new Promise((resolve, reject) => {
    if (file.size === 0) {
      const spark = new SparkMD5.ArrayBuffer();
      resolve(spark.end());
      return;
    }

    const chunkSize = CHUNK;
    const chunks = Math.ceil(file.size / chunkSize);
    let current = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();

    reader.onload = (e) => {
      spark.append(e.target.result);
      current += 1;
      if (current < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));

    function loadNext() {
      const start = current * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      reader.readAsArrayBuffer(file.slice(start, end));
    }
    loadNext();
  });
}
