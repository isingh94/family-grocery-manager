"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCurrentFamilyId } from "@/lib/helpers/getFamily";
import Navbar from "@/components/Navbar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ShoppingItem = {
	  id: string;
	    item_name: string;
	      quantity: number;
	        unit: string;
		  status: string;
		    source?: string;
};

export default function ShoppingListPage() {
	  const [itemName, setItemName] = useState("");
	    const [quantity, setQuantity] = useState("1");
	      const [unit, setUnit] = useState("pcs");
	        const [items, setItems] = useState<ShoppingItem[]>([]);

		  async function loadItems() {
			      const familyId = await getCurrentFamilyId();

			          if (!familyId) {
					        setItems([]);
						      return;
						          }

							      const { data } = await supabase
							            .from("shopping_list")
								          .select("*")
									        .eq("family_id", familyId)
										      .order("created_at", { ascending: false });

										          setItems(data || []);
											    }

											      async function addItem() {
												          if (!itemName.trim()) return;

													      const familyId = await getCurrentFamilyId();
													          if (!familyId) return;

														      await supabase.from("shopping_list").insert({
															            family_id: familyId,
																          item_name: itemName,
																	        quantity: Number(quantity),
																		      unit,
																		            status: "pending",
																			        });

																				    setItemName("");
																				        setQuantity("1");

																					    loadItems();
																					      }

																					        async function markBought(
																							    id: string,
																							        itemName: string,
																								    quantity: number,
																								        unit: string
																									  ) {
																										      await supabase
																										            .from("shopping_list")
																											          .update({
																													          status: "bought",
																														          completed_at: new Date().toISOString(),
																															        })
																																      .eq("id", id);

																																          const familyId = await getCurrentFamilyId();

																																	      const { data: existing } = await supabase
																																	            .from("inventory")
																																		          .select("*")
																																			        .eq("family_id", familyId)
																																				      .eq("item_name", itemName)
																																				            .maybeSingle();

																																					        if (existing) {
																																							      await supabase
																																							              .from("inventory")
																																								              .update({
																																										                quantity:
																																													            Number(existing.quantity) + Number(quantity),
																																												        })
																																													        .eq("id", existing.id);
																																														    } else {
																																															          await supabase.from("inventory").insert({
																																																	          family_id: familyId,
																																																		          item_name: itemName,
																																																			          quantity,
																																																				          unit,
																																																					        });
																																																						    }

																																																						        loadItems();
																																																							  }

																																																							    async function deleteItem(id: string) {
																																																								        await supabase
																																																									      .from("shopping_list")
																																																									            .delete()
																																																										          .eq("id", id);

																																																											      loadItems();
																																																											        }

																																																												  useEffect(() => {
																																																													      loadItems();
																																																													        }, []);

																																																														  return (
																																																															      <>
																																																															            <Navbar />

																																																																          <main className="p-6 max-w-4xl mx-auto">
																																																																	          <h1 className="text-3xl font-bold">
																																																																		            Shopping List
																																																																			            </h1>

																																																																				            <div className="mt-6 flex flex-col gap-3 md:flex-row">
																																																																					              <Input
																																																																						                  placeholder="Item"
																																																																								              value={itemName}
																																																																									                  onChange={(e) =>
																																																																												                setItemName(e.target.value)
																																																																														            }
																																																																															              />

																																																																																                <Input
																																																																																		            type="number"
																																																																																			                value={quantity}
																																																																																					            onChange={(e) =>
																																																																																							                  setQuantity(e.target.value)
																																																																																									              }
																																																																																										                />

																																																																																												          <Input
																																																																																													              value={unit}
																																																																																														                  onChange={(e) =>
																																																																																																	                setUnit(e.target.value)
																																																																																																			            }
																																																																																																				              />

																																																																																																					                <Button onClick={addItem}>
																																																																																																							            Add Item
																																																																																																								              </Button>
																																																																																																									              </div>

																																																																																																										              <div className="mt-8 space-y-4">
																																																																																																											                {items.map((item) => (
																																																																																																														            <Card key={item.id}>
																																																																																																															                  <CardContent className="p-4">
																																																																																																																	                  <div className="flex justify-between">
																																																																																																																			                    <div>
																																																																																																																					                        <div className="font-semibold">
																																																																																																																								                      {item.item_name}
																																																																																																																										                          </div>

																																																																																																																													                      <div className="text-sm text-muted-foreground">
																																																																																																																															                            {item.quantity} {item.unit}
																																																																																																																																		                        </div>

																																																																																																																																					                    <div className="mt-2 flex gap-2">
																																																																																																																																							                          <Badge>{item.status}</Badge>

																																																																																																																																										                        {item.source === "system" && (
																																																																																																																																														                        <Badge variant="outline">
																																																																																																																																																	                          AUTO
																																																																																																																																																				                          </Badge>
																																																																																																																																																							                        )}
																																																																																																																																																										                    </div>
																																																																																																																																																												                      </div>

																																																																																																																																																														                        <div className="flex gap-2">
																																																																																																																																																																	                    {item.status === "pending" && (
																																																																																																																																																																				                          <Button
																																																																																																																																																																							                          onClick={() =>
																																																																																																																																																																											                            markBought(
																																																																																																																																																																															                                item.id,
																																																																																																																																																																																			                            item.item_name,
																																																																																																																																																																																						                                item.quantity,
																																																																																																																																																																																										                            item.unit
																																																																																																																																																																																													                              )
																																																																																																																																																																																																                              }
																																																																																																																																																																																																			                            >
																																																																																																																																																																																																						                            Bought
																																																																																																																																																																																																									                          </Button>
																																																																																																																																																																																																												                      )}

																																																																																																																																																																																																														                          <Button
																																																																																																																																																																																																																	                        variant="destructive"
																																																																																																																																																																																																																				                      onClick={() =>
																																																																																																																																																																																																																							                              deleteItem(item.id)
																																																																																																																																																																																																																										                            }
																																																																																																																																																																																																																													                        >
																																																																																																																																																																																																																																                      Delete
																																																																																																																																																																																																																																		                          </Button>
																																																																																																																																																																																																																																					                    </div>
																																																																																																																																																																																																																																							                    </div>
																																																																																																																																																																																																																																									                  </CardContent>
																																																																																																																																																																																																																																											              </Card>
																																																																																																																																																																																																																																												                ))}
																																																																																																																																																																																																																																														        </div>
																																																																																																																																																																																																																																															      </main>
																																																																																																																																																																																																																																															          </>
																																																																																																																																																																																																																																																    );
}
