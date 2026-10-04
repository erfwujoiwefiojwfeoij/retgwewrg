'use client';

export default function Error({ reset }) {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="display text-5xl">Что-то пошло не так</h1>
        <button className="btn mt-8" type="button" onClick={reset}>Попробовать снова</button>
      </div>
    </main>
  );
}
