import { useRef, useEffect } from "react";
export const eggNames = new Set([
  "uwu",
  "legoshi",
  "jack",
  "haru",
  "louis",
  "furry",
  "xd",
  "lol",
  "anton",
  "mark scout",
  "helly riggs",
  "dylan george",
  "hatsune miku",
  "jamiroquai",
]);
export default function Credits({ virtual }) {
  const audio = useRef();
  useEffect(
    () => () => {
      audio.current?.pause();
    },
    [],
  );
  return (
    <div className={virtual ? "virtual-credits" : ""}>
      <img
        className="avatar"
        src="https://avatars.githubusercontent.com/u/205862753?v=4"
        alt="Gio Antonio Canto Gómez"
      />
      <h3>Sistema de creación de bitácoras duales :3</h3>
      <p>
        Ideado y creado por <strong>Gio Antonio Canto Gómez (COCYTIEG)</strong>.
      </p>
      <p>
        Apoyado por ChatGPT Sol Media. Hecho para todos los estudiantes que les
        da flojera hacer esta bitácora. Creado en 2026.
      </p>
      <p>Made by furries :3</p>
      <blockquote>
        A veces parece que lo hacen a posta que sean difíciles algunas veces,
        con lo fácil que es tomarte el tiempo para ayudar a tus compañeros.
        Hazlo a veces.
      </blockquote>
      {virtual && (
        <>
          <p>Virtual insanity. Encontraste otro rincón del programa.</p>
          <audio ref={audio} controls src="./Assets/Asset_vt_in_nocy.mp3" />
        </>
      )}
      <a
        className="button"
        href="https://github.com/gio-canto"
        target="_blank"
        rel="noreferrer"
      >
        GitHub de Gio
      </a>
    </div>
  );
}
