"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function DebugTest() {
    const [count, setCount] = useState(0);
    const [foo, setFoo] = useState("foo");
    const utils = api.useUtils();
    const [me] = api.post.hello.useSuspenseQuery({ text: `from tRPC ${count}` });

    return (
        <div>
        <button
            onClick={async () => {
                setFoo(`${me.greeting} updated`);
                console.log(me);
                await utils.post.hello.invalidate();
                setCount((prev) => prev + 1);
            }
            }
        >
            update me
        </button>
        This is test: |{foo}|
        </div>
    );
}