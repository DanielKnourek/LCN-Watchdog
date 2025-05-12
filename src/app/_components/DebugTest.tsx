"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "~/trpc/react";

export function DebugTest() {
    const [count, setCount] = useState(0);
    const [foo, setFoo] = useState("foo");
    const utils = api.useUtils();
    let [me] = api.post.hello.useSuspenseQuery({ text: `from tRPC ${count}` });

    return (
        <div>
        <button
            onClick={() => {
                setFoo(`${me.greeting} updated`);
                console.log(me);
                utils.post.hello.invalidate();
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