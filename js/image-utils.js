window.LaFondaImages = {

    async compress(
        archivo,
        ladoMaximo = 1100,
        calidad = 0.82
    ) {

        if (
            !archivo ||
            !archivo.type.startsWith(
                "image/"
            )
        ) {

            throw new Error(
                "Selecciona una imagen válida"
            );

        }

        const limite =
            12 * 1024 * 1024;

        if (archivo.size > limite) {

            throw new Error(
                "La imagen supera 12 MB"
            );

        }

        const origen =
            await new Promise(
                (resolve, reject) => {

                    const lector =
                        new FileReader();

                    lector.onload = () => {

                        resolve(
                            lector.result
                        );

                    };

                    lector.onerror = () => {

                        reject(
                            new Error(
                                "No se pudo leer la imagen"
                            )
                        );

                    };

                    lector.readAsDataURL(
                        archivo
                    );

                }
            );

        const imagen =
            await new Promise(
                (resolve, reject) => {

                    const elemento =
                        new Image();

                    elemento.onload = () => {

                        resolve(elemento);

                    };

                    elemento.onerror = () => {

                        reject(
                            new Error(
                                "No se pudo abrir la imagen"
                            )
                        );

                    };

                    elemento.src =
                        origen;

                }
            );

        let ancho =
            imagen.naturalWidth;

        let alto =
            imagen.naturalHeight;

        const escala =
            Math.min(
                1,
                ladoMaximo /
                Math.max(
                    ancho,
                    alto
                )
            );

        ancho =
            Math.max(
                1,
                Math.round(
                    ancho * escala
                )
            );

        alto =
            Math.max(
                1,
                Math.round(
                    alto * escala
                )
            );

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            ancho;

        canvas.height =
            alto;

        const contexto =
            canvas.getContext("2d");

        contexto.drawImage(
            imagen,
            0,
            0,
            ancho,
            alto
        );

        const dataUrl =
            canvas.toDataURL(
                "image/jpeg",
                calidad
            );

        return {

            base64:
                dataUrl.split(",")[1],

            mime:
                "image/jpeg",

            preview:
                dataUrl

        };

    }

};