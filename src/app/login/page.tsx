"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
	const router = useRouter();
	  const [email, setEmail] = useState("");
	    const [message, setMessage] = useState("");
	      const [loading, setLoading] = useState(false);
	      useEffect(() => {
		        async function checkSession() {
				    const {
					          data: { session },
						      } = await supabase.auth.getSession();

						          if (session) {
								        router.push("/dashboard");
									    }
									      }

									        checkSession();
	      }, [router]);

	        async function handleLogin() {
			    setLoading(true);

			        const { error } = await supabase.auth.signInWithOtp({
					      email,
					          });

						      if (error) {
							            setMessage(error.message);
								        } else {
										      setMessage("Check your email for the login link.");
										          }

											      setLoading(false);
											        }

												  return (
													      <main className="flex min-h-screen items-center justify-center">
													            <div className="w-[400px] rounded border p-6">
														            <h1 className="mb-4 text-2xl font-bold">
															              Family Grocery Manager
																              </h1>

																	              <input
																		                type="email"
																				          placeholder="Email"
																					            className="mb-4 w-full border p-2"
																						              value={email}
																							                onChange={(e) => setEmail(e.target.value)}
																									        />

																										        <button
																											          onClick={handleLogin}
																												            disabled={loading}
																													              className="w-full rounded bg-black p-2 text-white"
																														              >
																															                {loading ? "Sending..." : "Login"}
																																	        </button>

																																		        <p className="mt-4 text-sm">{message}</p>
																																			      </div>
																																			          </main>
																																				    );
}
