window.LaFondaImages = {
    async compress(file, maxSide = 1100, quality = 0.82) {
        if (!file || !file.type.startsWith("image/")) throw new Error("Selecciona una imagen válida");
        if (file.size > 12 * 1024 * 1024) throw new Error("La imagen supera 12 MB");

        const source = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
            reader.readAsDataURL(file);
        });

        const img = await new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("No se pudo abrir la imagen"));
            el.src = source;
        });

        let width = img.naturalWidth;
        let height = img.naturalHeight;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        return {
            base64: dataUrl.split(",")[1],
            mime: "image/jpeg",
            preview: dataUrl
        };
    }
};
