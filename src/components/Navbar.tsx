"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function Navbar() {
	  const router = useRouter();
	    const pathname = usePathname();

	      async function handleLogout() {
		          await supabase.auth.signOut();
			      router.push("/login");
			        }

				  function navClass(path: string) {
					      return pathname === path
					            ? "font-bold underline"
						          : "";
							    }

							      return (
								          <nav className="border-b bg-background">
									        <div className="mx-auto flex max-w-6xl items-center gap-4 p-4">
										        <div className="text-lg font-bold">
											          🛒 Family Grocery
												          </div>

													          <Link
														            href="/dashboard"
															              className={navClass("/dashboard")}
																              >
																	                Dashboard
																			        </Link>

																				        <Link
																					          href="/shopping-list"
																						            className={navClass("/shopping-list")}
																							            >
																								              Shopping
																									              </Link>

																										              <Link
																											                href="/inventory"
																													          className={navClass("/inventory")}
																														          >
																															            Inventory
																																            </Link>

																																	            <div className="ml-auto">
																																		              <Button
																																			                  variant="outline"
																																					              onClick={handleLogout}
																																						                >
																																								            Logout
																																									              </Button>
																																										              </div>
																																											            </div>
																																												        </nav>
																																													  );
}
