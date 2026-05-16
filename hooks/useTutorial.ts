import { useEffect, useState } from 'react';
import { getPref, setPref } from '../db/prefs';

export function useTutorial(key: string) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    getPref(key).then(val => {
      if (!val) setShow(true);
    });
  }, [key]);

  function dismiss() {
    setShow(false);
    setPref(key, '1');
  }

  return { show, dismiss };
}
