"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { getCurrentFamilyId } from "@/lib/helpers/getFamily";

import {
	  Card,
	    CardContent,
	      CardHeader,
	        CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
	const [shoppingCount, setShoppingCount] = useState(0);
	const [inventoryCount, setInventoryCount] = useState(0);
	const [familyCount, setFamilyCount] = useState(0);
	  const [email, setEmail] = useState("");

	    useEffect(() => {
		        async function loadUser() {
				      const {
					              data: { user },
						            } = await supabase.auth.getUser();

							          if (user) {
									          setEmail(user.email || "");
										  const familyId = await getCurrentFamilyId();

										  if (familyId) {
											    const { count: shopping } = await supabase
											        .from("shopping_list")
												    .select("*", {
													          count: "exact",
														        head: true,
															    })
															        .eq("family_id", familyId);

																  const { count: inventory } = await supabase
																      .from("inventory")
																          .select("*", {
																		        count: "exact",
																			      head: true,
																			          })
																				      .eq("family_id", familyId);

																				        setShoppingCount(shopping || 0);
																					  setInventoryCount(inventory || 0);
																					    setFamilyCount(1);
										  }
										        }
											    }

											        loadUser();
												  }, []);

												    return (
													        <>
														      <Navbar />

														            <main className="p-6">
															            <h1 className="text-3xl font-bold">
																              Family Grocery Manager
																	              </h1>

																		              <p className="mt-2 text-gray-500">
																			                Logged in as {email}
																					        </p>

																						        <div className="mt-8 grid gap-4 md:grid-cols-3">
																							          <Card>
																								              <CardHeader>
																									                    <CardTitle>Shopping</CardTitle>
																											                </CardHeader>

																													            <CardContent>
																														    <div className="text-3xl font-bold">
																														      {shoppingCount}
																														      </div>

																														      <div className="text-sm text-muted-foreground">
																														        Shopping Items
																															</div>
																																              </CardContent>
																																	                </Card>

																																			          <Card>
																																				              <CardHeader>
																																					                    <CardTitle>Inventory</CardTitle>
																																							                </CardHeader>

																																									            <CardContent>
																																										    <div className="text-3xl font-bold">
																																										      {inventoryCount}
																																										      </div>

																																										      <div className="text-sm text-muted-foreground">
																																										        Inventory Items
																																											</div>
																																												              </CardContent>
																																													                </Card>

																																															          <Card>
																																																              <CardHeader>
																																																	                    <CardTitle>Family</CardTitle>
																																																			                </CardHeader>

																																																					            <CardContent>
																																																						    <div className="text-3xl font-bold">
																																																						      {familyCount}
																																																						      </div>

																																																						      <div className="text-sm text-muted-foreground">
																																																						        Active Family
																																																							</div>
																																																								              </CardContent>
																																																									                </Card>
																																																											        </div>
																																																												      </main>
																																																												          </>
																																																													    );
}
